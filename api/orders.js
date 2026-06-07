// api/orders.js - Order management + Printify webhook handling
import { neon } from '@neondatabase/serverless';
import { sendDiscordAlert } from '../utils/discord-alerts.js';
import { verifyAdmin } from '../src/utils/auth.js';

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
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Printify-Signature');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // ---------------------------------------------------------
    // 📖 GET: Fetch orders (auth required)
    // ---------------------------------------------------------
    if (req.method === 'GET') {
      if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Authentication required' });
      const { id } = req.query;
      if (id) {
        const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
        if (!rows.length) return res.status(404).json({ success: false, error: 'Order not found' });
        return res.status(200).json({ success: true, order: rows[0] });
      }
      const rows = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
      return res.status(200).json({ success: true, orders: rows });
    }

    // ---------------------------------------------------------
    // ✏️ PUT: Update order fulfillment (auth required)
    // ---------------------------------------------------------
    if (req.method === 'PUT') {
      if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Authentication required' });
      const { id, fulfillment_status, fulfillment_notes } = req.body;
      if (!id) return res.status(400).json({ success: false, error: 'Missing order ID' });
      const fulfilledAt = fulfillment_status === 'fulfilled' ? new Date() : null;
      const rows = await sql`
        UPDATE orders SET fulfillment_status = ${fulfillment_status}, fulfillment_notes = ${fulfillment_notes},
            fulfilled_at = COALESCE(${fulfilledAt}, fulfilled_at)
        WHERE id = ${id} RETURNING *
      `;
      if (!rows.length) return res.status(404).json({ success: false, error: 'Order not found' });
      return res.status(200).json({ success: true, order: rows[0] });
    }

    // ---------------------------------------------------------
    // 📦 POST: Printify webhook (merged from printify-webhook.js)
    // ---------------------------------------------------------
    if (req.method === 'POST') {
      const event = req.body;
      console.log('📦 Printify webhook received:', event.event, event?.data?.id);

      switch (event.event) {
        case 'order.created': {
          const orderId = event.data?.id;
          const customerName = event.data?.recipient?.name;
          const itemsCount = event.data?.items?.length || 0;
          await sql`
            INSERT INTO orders (printify_order_id, status, items, created_at)
            VALUES (${orderId}, 'processing', ${JSON.stringify(event.data?.items || [])}, NOW())
            ON CONFLICT (printify_order_id) DO UPDATE SET status = EXCLUDED.status, items = EXCLUDED.items
          `;
          await sendDiscordAlert('info', 'Printify Order Created', [
            { name: 'Printify Order ID', value: orderId, inline: true },
            { name: 'Items', value: String(itemsCount), inline: true },
            { name: 'Customer', value: customerName || 'N/A', inline: true },
            { name: 'Status', value: '📦 Processing', inline: false }
          ], `New order received from Printify. Production started.`);
          break;
        }

        case 'order.fulfilled': {
          const orderId = event.data?.id;
          const trackingNumber = event.data?.tracking_numbers?.[0];
          const carrier = event.data?.carrier;
          await sql`
            UPDATE orders SET status = 'fulfilled', fulfilled_at = NOW(), tracking_number = ${trackingNumber}, carrier = ${carrier}
            WHERE printify_order_id = ${orderId}
          `;
          await sendDiscordAlert('success', 'Printify Order Fulfilled', [
            { name: 'Printify Order ID', value: orderId, inline: true },
            { name: 'Carrier', value: carrier || 'N/A', inline: true },
            { name: 'Tracking', value: trackingNumber || 'N/A', inline: true }
          ], `Order fulfilled and shipped! Tracking available.`);
          break;
        }

        case 'order.cancelled': {
          const orderId = event.data?.id;
          const reason = event.data?.cancellation_reason;
          await sql`UPDATE orders SET status = 'cancelled', cancellation_reason = ${reason} WHERE printify_order_id = ${orderId}`;
          await sendDiscordAlert('warning', 'Printify Order Cancelled', [
            { name: 'Printify Order ID', value: orderId, inline: true },
            { name: 'Reason', value: reason || 'Not specified', inline: false }
          ], `Order cancelled in Printify.`);
          break;
        }

        case 'order.processing': {
          const orderId = event.data?.id;
          await sql`UPDATE orders SET status = 'processing' WHERE printify_order_id = ${orderId}`;
          console.log(`🔄 Printify order processing: ${orderId}`);
          break;
        }

        case 'order.shipped': {
          const orderId = event.data?.id;
          const trackingNumber = event.data?.tracking_numbers?.[0];
          await sql`
            UPDATE orders SET status = 'shipped', tracking_number = ${trackingNumber}, shipped_at = NOW()
            WHERE printify_order_id = ${orderId}
          `;
          await sendDiscordAlert('info', 'Printify Order Shipped', [
            { name: 'Order ID', value: orderId, inline: true },
            { name: 'Tracking', value: trackingNumber || 'Pending', inline: true }
          ], `Order shipped! Tracking assigned.`);
          break;
        }

        case 'order.failed': {
          const orderId = event.data?.id;
          const error = event.data?.error?.message;
          await sql`UPDATE orders SET status = 'failed' WHERE printify_order_id = ${orderId}`;
          await sendDiscordAlert('error', 'Printify Order Failed', [
            { name: 'Order ID', value: orderId, inline: true },
            { name: 'Error', value: error || 'Unknown', inline: false }
          ], `Order creation/production failed. Immediate review required.`);
          break;
        }

        default:
          console.log(`🔵 Unhandled Printify event: ${event.event}`);
      }

      return res.status(200).json({ received: true, event: event.event });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Orders API Error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
