import db from '../src/utils/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { status = 'active' } = req.query;
    let query = 'SELECT id, title, description, status, created_at FROM products';
    if (status === 'active') {
      query += ' WHERE active = true';
    } else if (status === 'featured') {
      query += ' WHERE featured = true';
    }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await db.query(query);
    const items = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      createdAt: row.created_at
    }));

    res.status(200).json({ items, count: items.length });
  } catch (err) {
    console.error('Workshop products error:', err);
    res.status(500).json({ error: 'Database error' });
  }
}