// api/paypal-webhook.js - PayPal payment confirmations + Discord alerts
import { neon } from '@neondatabase/serverless';
import { sendDiscordAlert } from '../utils/discord-alerts.js';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, PayPal-Transmission-Id, PayPal-Transmission-Time, PayPal-Transmission-Sig, PayPal-Cert-Url, PayPal-Auth-Algo');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const event = req.body;
  console.log('💰 PayPal webhook received:', event.event_type, event.resource?.id);

  try {
    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const orderId = event.resource?.id;
        const amount = event.resource?.purchase_units?.[0]?.amount?.value;
        const payerEmail = event.resource?.payer?.email_address;
        const payerName = event.resource?.payer?.name?.given_name;

        // Update order in DB
        await sql`
          UPDATE orders 
          SET status = 'paid', 
              paid = true, 
              payment_intent_id = ${orderId},
              paid_at = NOW()
          WHERE paypal_order_id = ${orderId}
        `;

        // Verify order was updated
        const updated = await sql`SELECT * FROM orders WHERE paypal_order_id = ${orderId}`;
        if (updated.rows.length > 0) {
          console.log(`✅ PayPal order marked paid: ${orderId} ($${amount})`);

          // Discord alert
          await sendDiscordAlert('payment', 'PayPal Payment Received', [
            { name: 'Order ID', value: orderId, inline: true },
            { name: 'Amount', value: `$${amount}`, inline: true },
            { name: 'Buyer', value: payerName || payerEmail || 'Unknown', inline: true },
            { name: 'Status', value: '✅ Paid', inline: false }
          ], `A new payment has been captured and the order is now marked as paid.`);

          // Trigger Printify order creation (async - fire and forget)
          // TODO: call /api/payments?action=create-printify-order with order details
        } else {
          console.warn(`⚠️ PayPal order not found in DB: ${orderId}`);
          await sendDiscordAlert('warning', 'PayPal Payment — Order Not Found', [
            { name: 'Order ID', value: orderId, inline: true },
            { name: 'Amount', value: `$${amount}`, inline: true }
          ], `Payment was captured but no matching order found in database. Check order creation flow.`);
        }
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED': {
        const orderId = event.resource?.id;
        await sql`
          UPDATE orders 
          SET status = 'failed', paid = false
          WHERE paypal_order_id = ${orderId}
        `;
        await sendDiscordAlert('error', 'PayPal Payment Failed/Refunded', [
          { name: 'Order ID', value: orderId, inline: true },
          { name: 'Event', value: event.event_type, inline: true }
        ], `Payment capture failed or was refunded. Order marked as failed.`);
        break;
      }

      case 'CHECKOUT.ORDER.CANCELLED': {
        const orderId = event.resource?.id;
        await sql`
          UPDATE orders 
          SET status = 'cancelled'
          WHERE paypal_order_id = ${orderId}
        `;
        await sendDiscordAlert('warning', 'PayPal Order Cancelled', [
          { name: 'Order ID', value: orderId, inline: true }
        ], `Customer cancelled the checkout before payment.`);
        break;
      }

      default:
        console.log(`🔵 Unhandled PayPal event: ${event.event_type}`);
    }

    return res.status(200).json({ received: true, event: event.event_type });
  } catch (err) {
    console.error('💰 PayPal webhook error:', err);
    await sendDiscordAlert('error', 'PayPal Webhook Failure', [
      { name: 'Error', value: err.message, inline: false }
    ], `Webhook processing failed. Investigate immediately.`);
    return res.status(500).json({ error: err.message });
  }
}
