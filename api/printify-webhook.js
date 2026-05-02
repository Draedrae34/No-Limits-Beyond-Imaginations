// api/printify-webhook.js - Printify order status updates + Discord alerts
import { neon } from '@neondatabase/serverless';
import { sendDiscordAlert } from '../utils/discord-alerts.js';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Printify-Signature');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const event = req.body;
  console.log('📦 Printify webhook received:', event.event, event?.data?.id);

  try {
    switch (event.event) {
      case 'order.created': {
        const orderId = event.data?.id;
        const customerName = event.data?.recipient?.name;
        const itemsCount = event.data?.items?.length || 0;

        await sql`
          INSERT INTO orders (printify_order_id, status, items, created_at)
          VALUES (${orderId}, 'processing', ${JSON.stringify(event.data?.items || [])}, NOW())
          ON CONFLICT (printify_order_id) DO UPDATE 
          SET status = EXCLUDED.status, items = EXCLUDED.items
        `;

        await sendDiscordAlert('info', 'Printify Order Created', [
          { name: 'Printify Order ID', value: orderId, inline: true },
          { name: 'Items', value: String(itemsCount), inline: true },
          { name: 'Customer', value: customerName || 'N/A', inline: true },
          { name: 'Status', value: '📦 Processing', inline: false }
        ], `New order received from Printify. Production has started.`);
        break;
      }

      case 'order.fulfilled': {
        const orderId = event.data?.id;
        const trackingNumber = event.data?.tracking_numbers?.[0];
        const carrier = event.data?.carrier;

        await sql`
          UPDATE orders 
          SET status = 'fulfilled', 
              fulfilled_at = NOW(),
              tracking_number = ${trackingNumber},
              carrier = ${carrier}
          WHERE printify_order_id = ${orderId}
        `;

        await sendDiscordAlert('success', 'Printify Order Fulfilled', [
          { name: 'Printify Order ID', value: orderId, inline: true },
          { name: 'Carrier', value: carrier || 'N/A', inline: true },
          { name: 'Tracking', value: trackingNumber || 'N/A', inline: true }
        ], `Order has been fulfilled and shipped! Tracking info available.`);
        break;
      }

      case 'order.cancelled': {
        const orderId = event.data?.id;
        const reason = event.data?.cancellation_reason;

        await sql`
          UPDATE orders 
          SET status = 'cancelled', cancellation_reason = ${reason}
          WHERE printify_order_id = ${orderId}
        `;

        await sendDiscordAlert('warning', 'Printify Order Cancelled', [
          { name: 'Printify Order ID', value: orderId, inline: true },
          { name: 'Reason', value: reason || 'Not specified', inline: false }
        ], `Order was cancelled in Printify. Check reason.`);
        break;
      }

      case 'order.processing': {
        const orderId = event.data?.id;
        await sql`
          UPDATE orders SET status = 'processing' 
          WHERE printify_order_id = ${orderId}
        `;
        console.log(`🔄 Printify order processing: ${orderId}`);
        break;
      }

      case 'order.shipped': {
        const orderId = event.data?.id;
        const trackingNumber = event.data?.tracking_numbers?.[0];
        await sql`
          UPDATE orders 
          SET status = 'shipped', 
              tracking_number = ${trackingNumber},
              shipped_at = NOW()
          WHERE printify_order_id = ${orderId}
        `;
        await sendDiscordAlert('info', 'Printify Order Shipped', [
          { name: 'Order ID', value: orderId, inline: true },
          { name: 'Tracking', value: trackingNumber || 'Pending', inline: true }
        ], `Order has been shipped! Tracking number assigned.`);
        break;
      }

      case 'order.failed': {
        const orderId = event.data?.id;
        const error = event.data?.error?.message;
        await sql`
          UPDATE orders SET status = 'failed' 
          WHERE printify_order_id = ${orderId}
        `;
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
  } catch (err) {
    console.error('📦 Printify webhook error:', err);
    await sendDiscordAlert('error', 'Printify Webhook Failure', [
      { name: 'Error', value: err.message, inline: false },
      { name: 'Payload', value: JSON.stringify(event).slice(0, 500), inline: false }
    ], `Webhook processing failed. Check Printify integration.`);
    return res.status(500).json({ error: err.message });
  }
}
