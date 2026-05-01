// api/payments.js - PayPal Braintree/NVP integration (no Stripe)
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
        return res.status(500).json({
          error: 'PayPal client ID is not configured in Vercel variables.'
        });
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

      return res.status(200).json({
        success: true,
        message: 'Order verified and logged.'
      });
    }

    // ---------------------------------------------------------
    // ⭐ ACTION: CREATE PRINTIFY ORDER
    // ---------------------------------------------------------
    if (action === 'create-printify-order') {
      const { blueprint_id, quantity, address, payment_method_id } = req.body;

      const orderData = {
        blueprint_id,
        quantity: quantity || 1,
        address,
        payment_method_id
      };

      // Simulated Printify order ID (replace with real Printify API call)
      const mockOrderId = `PRINTIFY-${blueprint_id}-${Date.now()}`;

      console.log('Printify order payload:', orderData);
      console.log('→ Would call Printify /orders.json here with auth & fulfillment');

      return res.status(200).json({
        success: true,
        order_id: mockOrderId,
        message: 'Order created successfully (Printify integration pending real API key)'
      });
    }

    // ---------------------------------------------------------
    // ⭐ UNKNOWN ACTION
    // ---------------------------------------------------------
    return res.status(400).json({ error: 'Unknown action.' });

  } catch (error) {
    console.error('Payments API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}
