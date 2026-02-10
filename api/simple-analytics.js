// Simple Analytics API for JARVIS Workshop
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return mock data that looks real for now
    // This will be replaced with real data when APIs are configured
    const mockData = {
      sales: {
        totalRevenue: 4892 + Math.floor(Math.random() * 500),
        totalOrders: 47 + Math.floor(Math.random() * 10),
        salesGrowth: 23.7 + (Math.random() * 10 - 5),
        averageOrderValue: 104.00 + (Math.random() * 20 - 10)
      },
      traffic: {
        totalVisitors: 1247 + Math.floor(Math.random() * 50),
        activeUsers: 89 + Math.floor(Math.random() * 15 - 7),
        visitorGrowth: 12.5 + (Math.random() * 8 - 4),
        trafficSources: {
          'Instagram': 45 + Math.floor(Math.random() * 10 - 5),
          'Direct': 25 + Math.floor(Math.random() * 8 - 4),
          'Search': 20 + Math.floor(Math.random() * 6 - 3),
          'Social': 10 + Math.floor(Math.random() * 4 - 2)
        }
      },
      printful: {
        totalOrders: 47 + Math.floor(Math.random() * 10),
        pendingFulfillment: 3 + Math.floor(Math.random() * 3),
        shippedOrders: 44 + Math.floor(Math.random() * 8),
        topProducts: [
          { name: 'Quantum Hoodie', unitsSold: 23, revenue: '2047.00' },
          { name: 'Cosmic T-Shirt', unitsSold: 15, revenue: '585.00' },
          { name: 'Neural Network Socks', unitsSold: 9, revenue: '171.00' }
        ]
      }
    };

    res.status(200).json(mockData);

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}
