export default async function handler(req, res) {
  res.status(200).json({ status: 'Backend active', service: 'Silent Spirits API' });
}
