const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, customerEmail, metadata = {} } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in cart' });
    }

    // Map cart items to Stripe line items
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name || item.productName || 'Custom Design',
          description: item.size ? `Size: ${item.size}` : 'Custom apparel',
          images: (typeof item.image === 'string' && /^https?:\/\//i.test(item.image)) ? [item.image] : [],
          metadata: {
            design_id: item.designId || '',
            copyright_id: item.copyrightId || '',
            sku: item.sku || '',
          },
        },
        unit_amount: Math.round((item.price || 25) * 100),
      },
      quantity: item.quantity || 1,
    }));

    // Calculate shipping
    const shippingCost = 500; // $5.00 in cents

    // Create checkout session with enhanced features
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin || 'https://nolimitsbeyondlimitations.vercel.app'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://nolimitsbeyondlimitations.vercel.app'}/cancel.html`,
      customer_email: customerEmail,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'JP'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: shippingCost, currency: 'usd' },
            display_name: 'Standard Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 10 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 1500, currency: 'usd' },
            display_name: 'Express Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 2 },
              maximum: { unit: 'business_day', value: 5 },
            },
          },
        },
      ],
      metadata: {
        order_id: 'ORD-' + Date.now(),
        is_custom_design: items.some(item => item.designId) ? 'true' : 'false',
        ...metadata,
      },
      allow_promotion_codes: true,
      custom_text: {
        shipping_address_message: 'We ship worldwide from our print-on-demand partners.',
        submit_message: 'Your order will be custom printed just for you!',
      },
    });

    console.log('[Checkout] Created session:', session.id);

    return res.status(200).json({ 
      url: session.url, 
      sessionId: session.id,
      success: true 
    });
  } catch (error) {
    console.error('[Checkout] Error:', error.message);
    return res.status(500).json({ 
      error: error.message,
      success: false 
    });
  }
}

module.exports = handler;
module.exports.default = handler;
