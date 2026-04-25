export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ products: [
      { id: 'prod_001', name: 'Legacy Tee', description: 'Galaxy-print legend apparel' },
      { id: 'prod_002', name: 'No Limits Hoodie', description: 'Dreamwave cosmic hoodie' },
    ] });
  }

  if (req.method === 'POST') {
    const { name, description, price } = req.body;
    return res.status(200).json({ success: true, product: { id: `prod_${Date.now()}`, name, description, price } });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
