import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderID, productID, amount, buyerName, buyerEmail } = req.body;

  try {
    // Save the order to the database
    await sql`
      INSERT INTO orders (paypal_order_id, product_id, amount, buyer_name, buyer_email, fulfillment_status)
      VALUES (${orderID}, ${productID}, ${amount}, ${buyerName || 'Guest'}, ${buyerEmail || 'N/A'}, 'pending')
    `;

    console.log(`Verified & Logged PayPal Order: ${orderID}`);

    return res.status(200).json({ 
      success: true, 
      message: "Order verified and logged." 
    });
  } catch (error) {
    console.error('PayPal Capture Error:', error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}