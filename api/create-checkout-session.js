export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { product } = req.body;
    if (!product) {
      return res.status(400).json({ error: 'Product is required' });
    }

    const sessionId = `sess_${Date.now()}`;
    return res.status(200).json({ sessionId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
