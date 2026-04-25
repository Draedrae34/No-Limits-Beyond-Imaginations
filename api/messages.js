import pool from '../src/utils/db.js';

await pool.query(`
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    font TEXT NOT NULL DEFAULT 'Rajdhani',
    color TEXT NOT NULL DEFAULT '#FFD700',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { name, message, font, color } = body;

      await pool.query(
        'INSERT INTO messages (name, message, font, color) VALUES ($1, $2, $3, $4)',
        [name, message, font || 'Rajdhani', color || '#FFD700']
      );

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }
  }

  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        'SELECT id, name, message, font, color, created_at FROM messages ORDER BY id DESC'
      );
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }
  }

  res.status(405).end();
}
