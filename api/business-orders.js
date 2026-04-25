export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({ orders: [
    { id: 'order_001', status: 'fulfilled' },
    { id: 'order_002', status: 'pending' },
  ] });
}
