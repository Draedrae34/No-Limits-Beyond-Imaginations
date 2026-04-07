const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}