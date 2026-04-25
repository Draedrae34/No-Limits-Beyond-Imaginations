const PAYPAL_ENV = process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox';
const PAYPAL_BASE = PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

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
      return res.status(200).json({ success: true, data });
    }

    return res.status(400).json({ success: false, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
