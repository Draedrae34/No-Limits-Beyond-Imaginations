import pool from '../src/utils/db.js';

await pool.query(`
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    paypal_order_id TEXT NOT NULL,
    product_id TEXT,
    amount NUMERIC,
    buyer_email TEXT,
    buyer_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const result = await pool.query(
      'SELECT id, paypal_order_id, product_id, amount, buyer_email, buyer_name, created_at FROM orders ORDER BY created_at DESC'
    );
    return res.status(200).json({ success: true, orders: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Unable to fetch orders' });
  }
}
