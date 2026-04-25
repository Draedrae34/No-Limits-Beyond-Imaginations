export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { password } = req.body;
  const expected = process.env.QUANTUM_ADMIN_PASS || 'legendary';

  if (password === expected) {
    return res.status(200).json({ success: true, message: 'Authenticated' });
  }

  return res.status(401).json({ success: false, message: 'Invalid password' });
}
