const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const orderStore = require('../lib/order-store');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
const PRINTFUL_STORE_ID = process.env.PRINTFUL_STORE_ID;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM =
    process.env.EMAIL_FROM || 'No Limits Beyond Limitations <no-reply@nolimitsbeyondlimitations.com>';
const EMAIL_ADMIN = process.env.EMAIL_ADMIN || '';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log(`[Stripe Webhook] Signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('[Stripe Webhook] Payment successful:', session.id);

            try {
                const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
                    expand: ['line_items', 'customer_details', 'shipping_details'],
                });

                const savedOrder = await persistOrder(expandedSession);

                await fulfillWithPrintful(expandedSession, savedOrder);
                await sendConfirmationEmail(expandedSession, savedOrder);
            } catch (error) {
                console.error('[Stripe Webhook] Post-checkout processing failed:', error);
            }

            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('[Stripe Webhook] Payment failed:', failedPayment.id);
            break;

        case 'charge.refunded':
            const refund = event.data.object;
            console.log('[Stripe Webhook] Refund processed:', refund.id);
            break;

        default:
            console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
}

module.exports = handler;
module.exports.default = handler;
module.exports.config = {
    api: {
        bodyParser: false,
    },
};

async function persistOrder(session) {
    const lineItems = (session.line_items?.data || []).map((item) => ({
        id: item.id,
        quantity: item.quantity,
        description: item.description,
        price: item.price_data?.unit_amount || 0,
        metadata: item.price_data?.product_data?.metadata || {},
    }));

    const orderRecord = {
        id: session.id,
        orderId: session.metadata?.order_id || session.id,
        customerEmail: session.customer_email || '',
        amountTotal: session.amount_total || 0,
        currency: session.currency || 'usd',
        lineItems,
        metadata: session.metadata || {},
        shipping: session.shipping_details || session.customer_details?.address || {},
        paymentStatus: session.payment_status,
        status: 'paid',
        receivedAt: new Date().toISOString(),
    };

    return await orderStore.upsertOrder(orderRecord);
}

async function fulfillWithPrintful(session, savedOrder) {
    if (!PRINTFUL_API_KEY || !PRINTFUL_STORE_ID) {
        console.log('[Printful] Missing API key or store id, skipping fulfillment.');
        return;
    }

    const printfulItems = (session.line_items?.data || [])
        .map((item) => {
            const metadata = item.price_data?.product_data?.metadata || {};
            const variantId =
                parseInt(
                    metadata.printfulVariantId ||
                    metadata.printful_variant_id ||
                    metadata.variantId ||
                    metadata.variant_id,
                    10,
                ) || null;
            if (!variantId) {
                return null;
            }

            return {
                variant_id: variantId,
                quantity: item.quantity,
                name: item.description || item.price_data?.product_data?.name || 'No Limits Apparel',
                retail_price: ((item.price_data?.unit_amount || 0) / 100).toFixed(2),
            };
        })
        .filter(Boolean);

    if (printfulItems.length === 0) {
        console.log('[Printful] No valid variant IDs found, skipping order creation.');
        return;
    }

    const recipient = buildRecipient(session);
    if (!recipient.address1 || !recipient.city || !recipient.country_code) {
        console.log('[Printful] Recipient missing required address data, skipping order creation.');
        return;
    }

    const printfulPayload = {
        recipient,
        items: printfulItems,
        store: PRINTFUL_STORE_ID,
        external_id: savedOrder.orderId,
    };

    try {
        const printfulResponse = await createPrintfulOrder(printfulPayload);
        await orderStore.upsertOrder({
            id: savedOrder.id,
            printfulOrderId:
                printfulResponse?.result?.id ||
                printfulResponse?.order?.id ||
                printfulResponse?.id ||
                null,
            printfulStatus: printfulResponse?.result?.state || printfulResponse?.result?.status || null,
            printfulResponse,
        });
        console.log('[Printful] Order created successfully', printfulResponse?.result?.id);
    } catch (error) {
        console.error('[Printful] Order creation failed:', error);
    }
}

function buildRecipient(session) {
    const shipping = session.shipping_details || {};
    const address = shipping.address || session.customer_details?.address || {};
    return {
        name:
            shipping?.name ||
            session.customer_details?.name ||
            session.customer_email ||
            'No Limits Customer',
        address1: address?.line1 || address?.address_line1 || '',
        address2: address?.line2 || address?.address_line2 || '',
        city: address?.city || '',
        state_code: address?.state || address?.state_code || '',
        country_code: address?.country || address?.country_code || '',
        zip: address?.postal_code || address?.zip || '',
        email: session.customer_email || '',
        phone: shipping?.phone || session.customer_details?.phone || '',
    };
}

async function createPrintfulOrder(payload) {
    const baseUrl = 'https://api.printful.com/orders';
    const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${PRINTFUL_API_KEY}:`).toString('base64')}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Printful API error: ${errorText}`);
    }

    return await response.json();
}

async function sendConfirmationEmail(session, order) {
    if (!session.customer_email) {
        console.log('[Email] No customer email available, skipping confirmation email.');
        return;
    }

    const payload = {
        personalizations: [
            {
                to: [{ email: session.customer_email }],
                subject: `Your No Limits order ${order.orderId || session.id} is confirmed!`,
                dynamic_template_data: {
                    name: session.customer_details?.name || 'No Limits Family',
                    total:
                        '$' +
                        ((session.amount_total || 0) / 100).toFixed(2),
                    orderNumber: order.orderId || session.id,
                },
            },
        ],
        from: { email: EMAIL_FROM },
        content: [
            {
                type: 'text/html',
                value: `<p>Thank you for the order. We saved your order ${order.orderId ||
                    session.id} and our team is now forwarding it to the makers. We'll email you again when it's on the move.</p>`,
            },
        ],
    };

    if (EMAIL_ADMIN) {
        payload.personalizations[0].bcc = [{ email: EMAIL_ADMIN }];
    }

    if (!SENDGRID_API_KEY) {
        console.log(
            '[Email] SENDGRID_API_KEY is not configured. Confirmation email content:',
            JSON.stringify(payload, null, 2),
        );
        return;
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        console.error('[Email] SendGrid rejected email:', await response.text());
    } else {
        console.log('[Email] Confirmation email queued for', session.customer_email);
    }
}
