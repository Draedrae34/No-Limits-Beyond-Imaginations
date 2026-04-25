import pool from '../src/utils/db.js';

const PAYPAL_ENV = process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox';
const PAYPAL_BASE = PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { orderID } = body || {};

    if (!orderID) {
      return res.status(400).json({ success: false, error: 'Missing orderID' });
    }

    const auth = Buffer.from(
      process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_SECRET
    ).toString('base64');

    const response = await fetch(
      `${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const data = await response.json();

    if (data.status === 'COMPLETED') {
      const purchaseUnit = data.purchase_units?.[0] || {};
      const capture = purchaseUnit.payments?.captures?.[0] || {};
      const amount = capture.amount?.value ? parseFloat(capture.amount.value) : null;
      const productId = purchaseUnit.custom_id || purchaseUnit.reference_id || null;
      const buyerEmail = data.payer?.email_address || null;
      const buyerName = data.payer?.name
        ? [data.payer.name.given_name, data.payer.name.surname].filter(Boolean).join(' ')
        : null;

      const insertResult = await pool.query(
        `INSERT INTO orders (paypal_order_id, product_id, amount, buyer_email, buyer_name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [data.id, productId, amount, buyerEmail, buyerName]
      );

      return res.status(200).json({
        success: true,
        orderId: insertResult.rows[0]?.id,
        data,
      });
    }

    return res.status(400).json({ success: false, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
