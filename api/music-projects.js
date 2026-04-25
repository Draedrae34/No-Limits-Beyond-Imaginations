export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ projects: ['Nebula Beats', 'Midnight Cipher', 'Soul Engine'] });
  }
  if (req.method === 'POST') {
    const { name } = req.body;
    return res.status(200).json({ success: true, project: { name } });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
