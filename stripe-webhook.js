import Stripe from 'stripe';
import fetch from 'node-fetch';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false, // Stripe needs the raw body for signature verification
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error(`[Webhook Error]: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Retrieve line items with metadata
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product'],
    });

    // Format the order for Printify
    const printifyOrder = {
      external_id: session.id,
      label: `Order_${session.id.slice(-8)}`,
      line_items: lineItems.data.map(item => ({
        product_id: item.price.product.metadata.printify_blueprint_id,
        variant_id: parseInt(item.price.product.metadata.printify_variant_id),
        quantity: item.quantity
      })),
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: {
        first_name: session.shipping_details.name.split(' ')[0],
        last_name: session.shipping_details.name.split(' ').slice(1).join(' '),
        email: session.customer_details.email,
        phone: session.customer_details.phone || '',
        address1: session.shipping_details.address.line1,
        address2: session.shipping_details.address.line2 || '',
        city: session.shipping_details.address.city,
        region: session.shipping_details.address.state,
        zip: session.shipping_details.address.postal_code,
        country: session.shipping_details.address.country
      }
    };

    // Send to Printify
    try {
      const response = await fetch(
        `https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/orders.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PRINTIFY_API_TOKEN}`
          },
          body: JSON.stringify(printifyOrder)
        }
      );
      
      const result = await response.json();
      console.log('[Printify Order Success]:', result.id);
    } catch (error) {
      console.error('[Printify API Error]:', error);
      return res.status(500).json({ error: 'Failed to send order to Printify' });
    }
  }

  res.json({ received: true });
}