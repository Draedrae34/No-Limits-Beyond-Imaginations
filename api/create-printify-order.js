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
    const { blueprint_id, quantity, address, payment_method_id } = req.body;

    // Here you would integrate with Printify API to create the order
    // For now, we'll simulate the order creation

    const orderData = {
      blueprint_id: blueprint_id,
      quantity: quantity || 1,
      address: address,
      payment_method_id: payment_method_id
    };

    // Simulate Printify API call
    const mockOrderId = `PRINTIFY-${blueprint_id}-${Date.now()}`;

    console.log('Printify order would be created:', orderData);

    return res.status(200).json({
      success: true,
      order_id: mockOrderId,
      message: 'Order created successfully (Printify integration pending)'
    });
  } catch (error) {
    console.error('Printify order error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}