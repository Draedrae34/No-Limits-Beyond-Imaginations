import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Initialize messages table with moderation fields
const initializeDatabase = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        message TEXT NOT NULL,
        font TEXT NOT NULL DEFAULT 'Rajdhani',
        color TEXT NOT NULL DEFAULT '#FFD700',
        approved BOOLEAN DEFAULT TRUE,
        hidden BOOLEAN DEFAULT FALSE,
        admin_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    
    // Add moderation columns if they don't exist (for existing tables)
    await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT TRUE`;
    await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS admin_notes TEXT`;
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

// Initialize database on module load
initializeDatabase().catch(console.error);

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { filter, q } = req.query;

      let where = [];
      let params = [];
      let i = 1;

      if (filter === 'approved') {
        where.push(`approved = TRUE AND hidden = FALSE`);
      } else if (filter === 'hidden') {
        where.push(`hidden = TRUE`);
      } else if (filter === 'unapproved') {
        where.push(`approved = FALSE`);
      }

      if (q) {
        where.push(`(name ILIKE $${i} OR message ILIKE $${i})`);
        params.push(`%${q}%`);
        i++;
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const rows = await sql(
        `SELECT id, name, message, font, color, created_at, approved, hidden, admin_notes
         FROM messages
         ${whereSql}
         ORDER BY created_at DESC`,
        params
      );

      return res.status(200).json({ success: true, messages: rows });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { name, message, font, color } = body;

      if (!name || !message) {
        return res.status(400).json({ success: false, error: 'Missing fields' });
      }

      const rows = await sql(
        `INSERT INTO messages (name, message, font, color)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, message, font, color, created_at, approved, hidden, admin_notes`,
        [name, message, font || 'Rajdhani', color || '#FFD700']
      );

      return res.status(201).json({ success: true, message: rows[0] });
    }

    if (req.method === 'PUT') {
      const { id, approved, hidden, admin_notes } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Missing id' });
      }

      const rows = await sql(
        `UPDATE messages
         SET approved = COALESCE($2, approved),
             hidden = COALESCE($3, hidden),
             admin_notes = COALESCE($4, admin_notes)
         WHERE id = $1
         RETURNING id, name, message, font, color, created_at, approved, hidden, admin_notes`,
        [id, approved, hidden, admin_notes]
      );

      if (!rows.length) {
        return res.status(404).json({ success: false, error: 'Message not found' });
      }

      return res.status(200).json({ success: true, message: rows[0] });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Missing id' });
      }

      const rows = await sql(
        `DELETE FROM messages WHERE id = $1 RETURNING id`,
        [id]
      );

      if (!rows.length) {
        return res.status(404).json({ success: false, error: 'Message not found' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('messages API error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}
