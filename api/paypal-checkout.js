import pool from '../src/utils/db.js';
import { ensureOrdersSchema } from '../src/utils/orders.js';

const PAYPAL_ENV = process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox';
const PAYPAL_BASE = PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

await ensureOrdersSchema(pool);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { orderID, productID, amount } = body || {};

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

    if (data.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, data });
    }

    const payer = data.payer || {};
    const buyerEmail = payer.email_address || null;
    const buyerName = payer.name
      ? [payer.name.given_name, payer.name.surname].filter(Boolean).join(' ')
      : null;

    await pool.query(
      `INSERT INTO orders (paypal_order_id, product_id, amount, buyer_email, buyer_name)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderID, productID || null, amount || null, buyerEmail, buyerName]
    );

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
