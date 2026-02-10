// Real Stripe Sales Analytics API
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get real sales data from Stripe
    const charges = await stripe.charges.list({
      limit: 100,
      created: {
        gte: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60), // Last 30 days
      },
      expand: ['data.customer']
    });

    const totalRevenue = charges.data.reduce((sum, charge) => {
      return sum + (charge.status === 'succeeded' ? charge.amount : 0);
    }, 0);

    const totalOrders = charges.data.filter(charge => charge.status === 'succeeded').length;

    // Calculate growth (compare with previous period)
    const previousCharges = await stripe.charges.list({
      limit: 100,
      created: {
        gte: Math.floor(Date.now() / 1000) - (60 * 24 * 60 * 60), // Previous 30 days
        lt: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60),
      }
    });

    const previousRevenue = previousCharges.data.reduce((sum, charge) => {
      return sum + (charge.status === 'succeeded' ? charge.amount : 0);
    }, 0);

    const salesGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : 0;

    // Get recent transactions for live updates
    const recentTransactions = charges.data
      .filter(charge => charge.status === 'succeeded')
      .slice(0, 10)
      .map(charge => ({
        amount: charge.amount / 100,
        currency: charge.currency,
        customer: charge.customer?.email || 'Anonymous',
        created: charge.created,
        description: charge.description
      }));

    res.status(200).json({
      totalRevenue: totalRevenue / 100, // Convert to dollars
      totalOrders,
      salesGrowth: parseFloat(salesGrowth),
      recentTransactions,
      averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders / 100).toFixed(2) : 0,
      currency: 'USD'
    });

  } catch (error) {
    console.error('Stripe Analytics Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sales data',
      message: error.message 
    });
  }
}
