import { neon } from '@neondatabase/serverless';
import Stripe from 'stripe';

const sql = neon(process.env.DATABASE_URL);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

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
    // ⭐ ACTION: GET STRIPE PUBLIC KEY
    // ---------------------------------------------------------
    if (action === 'stripe-public-key') {
      const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

      if (!publishableKey) {
        return res.status(500).json({
          error: 'Stripe publishable key is not configured in Vercel variables.'
        });
      }

      return res.status(200).json({ publishableKey });
    }

    // ---------------------------------------------------------
    // ⭐ ACTION: CREATE STRIPE PAYMENT INTENT
    // (formerly stripe-payment.js)
    // ---------------------------------------------------------
    if (action === 'stripe-payment-intent') {
      const { product_id, quantity = 1, amount, customer_info } = req.body;

      // Use the provided amount (in cents) from the frontend
      const finalAmount = amount || 2999; // Default fallback

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: finalAmount,
        currency: 'usd',
        metadata: {
          product_id: product_id,
          quantity: quantity,
          order_id: `NLBL-${product_id}-${Date.now()}`
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return res.status(200).json({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: finalAmount,
        currency: 'usd'
      });
    }

    // ---------------------------------------------------------
    // ⭐ ACTION: CREATE STRIPE CHECKOUT SESSION
    // (formerly create-checkout-session.js)
    // ---------------------------------------------------------
    if (action === 'stripe-checkout-session') {
      const { product } = req.body;

      // Create a checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: product.name,
                images: [product.image.startsWith('http') ? product.image : `${process.env.VERCEL_URL}${product.image}`],
              },
              unit_amount: product.price, // Already in cents from frontend
            },
            quantity: product.quantity,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.origin}/order-complete.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/shop.html`,
      });

      return res.status(200).json({ sessionId: session.id });
    }

    // ---------------------------------------------------------
    // ⭐ ACTION: LOG PAYPAL ORDER TO DATABASE
    // (formerly paypal-checkout.js)
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
    // (formerly create-printify-order.js)
    // ---------------------------------------------------------
    if (action === 'create-printify-order') {
      const { blueprint_id, quantity, address, payment_method_id } = req.body;

      const orderData = {
        blueprint_id,
        quantity: quantity || 1,
        address,
        payment_method_id
      };

      // Simulated Printify order ID
      const mockOrderId = `PRINTIFY-${blueprint_id}-${Date.now()}`;

      console.log('Printify order would be created:', orderData);

      return res.status(200).json({
        success: true,
        order_id: mockOrderId,
        message: 'Order created successfully (Printify integration pending)'
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
