/**
 * Order Management API
 * Handles order status, history, and management
 */

const orders = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, orderId } = req.query;

    if (req.method === 'GET') {
      if (orderId) {
        const order = orders.get(orderId);
        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }
        return res.status(200).json({ success: true, data: order });
      }
      
      const allOrders = Array.from(orders.values());
      return res.status(200).json({ success: true, data: allOrders });
    }

    if (req.method === 'POST') {
      const orderData = req.body;
      const newOrderId = 'ORD-' + Date.now();
      const order = {
        id: newOrderId,
        ...orderData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      orders.set(newOrderId, order);
      return res.status(201).json({ success: true, data: order });
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
