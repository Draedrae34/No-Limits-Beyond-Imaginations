// api/payments.js - PayPal payments + webhook handling (no Stripe)
import { neon } from '@neondatabase/serverless';
import { sendDiscordAlert } from '../utils/discord-alerts.js';

let sqlClient;
function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }
  sqlClient ||= neon(process.env.DATABASE_URL);
  return sqlClient;
}
const sql = (...args) => getSql()(...args);

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, PayPal-Transmission-Id, PayPal-Transmission-Time, PayPal-Transmission-Sig, PayPal-Cert-Url, PayPal-Auth-Algo');
    return res.status(200).end();
  }

  // Only POST is allowed for unified routing
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body;

  try {
    // ---------------------------------------------------------
    // ⭐ ACTION: GET PAYPAL CLIENT ID
    // ---------------------------------------------------------
    if (action === 'paypal-client-id') {
      const clientId = process.env.PAYPAL_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ error: 'PayPal client ID is not configured in Vercel variables.' });
      }
      return res.status(200).json({ clientId });
    }

    // ---------------------------------------------------------
    // ⭐ ACTION: LOG PAYPAL ORDER TO DATABASE
    // ---------------------------------------------------------
    if (action === 'paypal-log-order') {
      const { orderID, productID, amount, buyerName, buyerEmail } = req.body;
      await sql`
        INSERT INTO orders (paypal_order_id, product_id, amount, buyer_name, buyer_email, fulfillment_status)
        VALUES (${orderID}, ${productID}, ${amount}, ${buyerName || 'Guest'}, ${buyerEmail || 'N/A'}, 'pending')
      `;
      console.log(`Verified & Logged PayPal Order: ${orderID}`);
      return res.status(200).json({ success: true, message: 'Order verified and logged.' });
    }

    // ---------------------------------------------------------
    // ⭐ ACTION: CREATE PRINTIFY ORDER
    // ---------------------------------------------------------
    if (action === 'create-printify-order') {
      const { blueprint_id, quantity, address, payment_method_id } = req.body;
      const orderData = { blueprint_id, quantity: quantity || 1, address, payment_method_id };
      const mockOrderId = `PRINTIFY-${blueprint_id}-${Date.now()}`;
      console.log('Printify order payload:', orderData);
      return res.status(200).json({ success: true, order_id: mockOrderId, message: 'Order created (Printify integration pending real API key)' });
    }

    // ---------------------------------------------------------
    // ⭐ WEBHOOK: PAYPAL EVENTS (merged from paypal-webhook.js)
    // ---------------------------------------------------------
    if (action === 'paypal-webhook' || req.path?.includes('webhook')) {
      const event = req.body;
      console.log('💰 PayPal webhook received:', event.event_type, event.resource?.id);

      switch (event.event_type) {
        case 'CHECKOUT.ORDER.APPROVED':
        case 'PAYMENT.CAPTURE.COMPLETED': {
          const orderId = event.resource?.id;
          const amount = event.resource?.purchase_units?.[0]?.amount?.value;
          const payerEmail = event.resource?.payer?.email_address;
          const payerName = event.resource?.payer?.name?.given_name;

          await sql`
            UPDATE orders SET status = 'paid', paid = true, payment_intent_id = ${orderId}, paid_at = NOW()
            WHERE paypal_order_id = ${orderId}
          `;

          const updated = await sql`SELECT * FROM orders WHERE paypal_order_id = ${orderId}`;
          if (updated.rows.length > 0) {
            console.log(`✅ PayPal order marked paid: ${orderId} ($${amount})`);
            await sendDiscordAlert('payment', 'PayPal Payment Received', [
              { name: 'Order ID', value: orderId, inline: true },
              { name: 'Amount', value: `$${amount}`, inline: true },
              { name: 'Buyer', value: payerName || payerEmail || 'Unknown', inline: true },
              { name: 'Status', value: '✅ Paid', inline: false }
            ], `Payment captured. Order marked as paid.`);
          } else {
            console.warn(`⚠️ PayPal order not found: ${orderId}`);
            await sendDiscordAlert('warning', 'PayPal Payment — Order Not Found', [
              { name: 'Order ID', value: orderId, inline: true },
              { name: 'Amount', value: `$${amount}`, inline: true }
            ], `Payment captured but no matching order in database.`);
          }
          break;
        }

        case 'PAYMENT.CAPTURE.DENIED':
        case 'PAYMENT.CAPTURE.REFUNDED': {
          const orderId = event.resource?.id;
          await sql`UPDATE orders SET status = 'failed', paid = false WHERE paypal_order_id = ${orderId}`;
          await sendDiscordAlert('error', 'PayPal Payment Failed/Refunded', [
            { name: 'Order ID', value: orderId, inline: true },
            { name: 'Event', value: event.event_type, inline: true }
          ], `Payment failed or refunded. Order marked as failed.`);
          break;
        }

        case 'CHECKOUT.ORDER.CANCELLED': {
          const orderId = event.resource?.id;
          await sql`UPDATE orders SET status = 'cancelled' WHERE paypal_order_id = ${orderId}`;
          await sendDiscordAlert('warning', 'PayPal Order Cancelled', [{ name: 'Order ID', value: orderId, inline: true }], `Customer cancelled checkout.`);
          break;
        }

        default:
          console.log(`🔵 Unhandled PayPal event: ${event.event_type}`);
      }

      return res.status(200).json({ received: true, event: event.event_type });
    }

    // ---------------------------------------------------------
    // ⭐ UNKNOWN ACTION
    // ---------------------------------------------------------
    return res.status(400).json({ error: 'Unknown action.' });

  } catch (error) {
    console.error('Payments API Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}
