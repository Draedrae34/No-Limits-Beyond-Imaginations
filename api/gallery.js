let galleryItems = [];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ success: true, items: galleryItems });
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { title, imageUrl } = body || {};

      if (!title || !imageUrl) {
        return res.status(400).json({ success: false, error: 'Missing title or imageUrl' });
      }

      const newItem = {
        id: galleryItems.length + 1,
        title,
        imageUrl,
        created_at: new Date().toISOString(),
      };
      galleryItems.unshift(newItem);
      return res.status(200).json({ success: true, item: newItem });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: 'Unable to save gallery item' });
    }
  }

  res.status(405).json({ success: false, error: 'Method not allowed' });
}
