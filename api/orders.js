import pool from '../src/utils/db.js';
import { ensureOrdersSchema } from '../src/utils/orders.js';

await ensureOrdersSchema(pool);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const orderId = req.query?.id;

      if (orderId) {
        const single = await pool.query(
          `SELECT id, paypal_order_id, product_id, amount, buyer_email, buyer_name,
                  fulfillment_status, fulfillment_notes, fulfilled_at, created_at
           FROM orders
           WHERE id = $1`,
          [orderId]
        );

        if (!single.rows.length) {
          return res.status(404).json({ success: false, error: 'Order not found' });
        }

        return res.status(200).json({ success: true, order: single.rows[0] });
      }

      const result = await pool.query(
        `SELECT id, paypal_order_id, product_id, amount, buyer_email, buyer_name,
                fulfillment_status, fulfillment_notes, fulfilled_at, created_at
         FROM orders
         ORDER BY created_at DESC`
      );
      return res.status(200).json({ success: true, orders: result.rows });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: 'Unable to fetch orders' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { id, fulfillment_status, fulfillment_notes } = body;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Missing order id' });
      }

      const status = fulfillment_status === 'fulfilled' ? 'fulfilled' : 'pending';
      const notes = typeof fulfillment_notes === 'string' ? fulfillment_notes.trim() || null : null;

      const result = await pool.query(
        `UPDATE orders
         SET fulfillment_status = $1,
             fulfillment_notes = $2,
             fulfilled_at = CASE
               WHEN $1 = 'fulfilled' THEN COALESCE(fulfilled_at, NOW())
               ELSE NULL
             END
         WHERE id = $3
         RETURNING id, paypal_order_id, product_id, amount, buyer_email, buyer_name,
                   fulfillment_status, fulfillment_notes, fulfilled_at, created_at`,
        [status, notes, id]
      );

      if (!result.rows.length) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      return res.status(200).json({ success: true, order: result.rows[0] });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: 'Unable to update order' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
