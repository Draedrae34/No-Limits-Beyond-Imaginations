import { neon } from '@neondatabase/serverless';
import { verifyAdmin } from '../src/utils/auth.js';

let sqlClient;
function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }
  sqlClient ||= neon(process.env.DATABASE_URL);
  return sqlClient;
}
const sql = (...args) => getSql()(...args);

const actions = {
  // 🕯️ LIST MESSAGES
  list: async (req, res) => {
    const { filter, q } = req.query;
    let where = [];
    let params = [];
    let i = 1;

    if (filter === 'approved') where.push(`approved = TRUE AND hidden = FALSE`);
    else if (filter === 'hidden') where.push(`hidden = TRUE`);
    else if (filter === 'unapproved') where.push(`approved = FALSE`);

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
  },

  // 🕯️ ADD MESSAGE
  add: async (req, res) => {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { name, message, font, color } = body;

    if (!name || !message)
      return res.status(400).json({ success: false, error: 'Missing fields' });

    const rows = await sql(
      `INSERT INTO messages (name, message, font, color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, message, font || 'Rajdhani', color || '#FFD700']
    );

    return res.status(201).json({ success: true, message: rows[0] });
  },

  // 🕯️ UPDATE MESSAGE (ADMIN)
  update: async (req, res) => {
    if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });

    const { id, approved, hidden, admin_notes } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Missing id' });

    const rows = await sql(
      `UPDATE messages
       SET approved = COALESCE($2, approved),
           hidden = COALESCE($3, hidden),
           admin_notes = COALESCE($4, admin_notes)
       WHERE id = $1
       RETURNING *`,
      [id, approved, hidden, admin_notes]
    );

    if (!rows.length) return res.status(404).json({ success: false, error: 'Message not found' });
    return res.status(200).json({ success: true, message: rows[0] });
  },

  // 🕯️ DELETE MESSAGE (ADMIN)
  delete: async (req, res) => {
    if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Missing id' });

    const rows = await sql(`DELETE FROM messages WHERE id = $1 RETURNING id`, [id]);
    if (!rows.length)
      return res.status(404).json({ success: false, error: 'Message not found' });

    return res.status(200).json({ success: true });
  },

  // 🕯️ GALLERY LIST
  galleryList: async (req, res) => {
    const rows = await sql(`SELECT * FROM gallery ORDER BY uploaded_at DESC`);
    return res.status(200).json({ success: true, gallery: rows });
  },

  // 🕯️ GALLERY ADD (ADMIN)
  galleryAdd: async (req, res) => {
    if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });

    const { url, caption } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing url' });

    const rows = await sql(
      `INSERT INTO gallery (image_url, filename, cosmic_text) VALUES ($1, $1, $2) RETURNING *`,
      [url, caption || 'A moment frozen in time...']
    );

    return res.status(201).json({ success: true, item: rows[0] });
  },

  // 🕯️ GALLERY DELETE (ADMIN)
  galleryDelete: async (req, res) => {
    if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const rows = await sql(`DELETE FROM gallery WHERE id = $1 RETURNING id`, [id]);
    if (!rows.length)
      return res.status(404).json({ success: false, error: 'Gallery item not found' });

    return res.status(200).json({ success: true });
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action = 'list' } = req.query;

  try {
    if (actions[action]) {
      console.log(`🕯️ [NLBL Remembrance] Action: ${action}`);
      return await actionsaction;
    }
    return res.status(400).json({ error: `Unknown action '${action}'` });
  } catch (err) {
    console.error('🕯️ [NLBL Remembrance] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
