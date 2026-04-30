import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    res.status(200).json({ sessionId: session.id });
  } catch (err) {
    console.error('Stripe Session Error:', err);
    res.status(500).json({ error: err.message });
  }
}