const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`[Stripe Webhook] Signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('[Stripe Webhook] Payment successful:', session.id);
      
      // TODO: Send order to Printful
      // TODO: Save order to database
      // TODO: Send confirmation email
      
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('[Stripe Webhook] Payment failed:', failedPayment.id);
      break;

    case 'charge.refunded':
      const refund = event.data.object;
      console.log('[Stripe Webhook] Refund processed:', refund.id);
      break;

    default:
      console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
