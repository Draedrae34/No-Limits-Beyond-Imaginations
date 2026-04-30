import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { id } = req.query;

      if (id) {
        const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
        if (!rows.length) return res.status(404).json({ success: false, error: 'Order not found' });
        return res.status(200).json({ success: true, order: rows[0] });
      }

      const rows = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
      return res.status(200).json({ success: true, orders: rows });
    }

    if (req.method === 'PUT') {
      const { id, fulfillment_status, fulfillment_notes } = req.body;
      if (!id) return res.status(400).json({ success: false, error: 'Missing order ID' });

      const fulfilledAt = fulfillment_status === 'fulfilled' ? new Date() : null;

      const rows = await sql`
        UPDATE orders 
        SET fulfillment_status = ${fulfillment_status}, 
            fulfillment_notes = ${fulfillment_notes},
            fulfilled_at = COALESCE(${fulfilledAt}, fulfilled_at)
        WHERE id = ${id}
        RETURNING *
      `;

      if (!rows.length) return res.status(404).json({ success: false, error: 'Order not found' });
      return res.status(200).json({ success: true, order: rows[0] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Orders API Error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}