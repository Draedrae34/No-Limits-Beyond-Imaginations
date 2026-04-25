export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return res.status(200).json({ lyrics: ['Ride the cosmic wave', 'Dreams beyond the stars', 'Legacy born in light'] });
}
