import pool from '../src/utils/db.js';
import { verifyAdmin } from '../src/utils/auth.js';

let studioSchemaReadyPromise;

async function ensureStudioExportsSchema() {
  if (!studioSchemaReadyPromise) {
    studioSchemaReadyPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS studio_exports (
          id SERIAL PRIMARY KEY,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          payload JSONB NOT NULL,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`ALTER TABLE studio_exports ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'`);
      await pool.query(`ALTER TABLE studio_exports ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`);
    })();
  }
  return studioSchemaReadyPromise;
}

async function parseBody(req) {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await ensureStudioExportsSchema();

    if (req.method === 'GET') {
      if (!(await verifyAdmin(req))) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const result = await pool.query('SELECT * FROM studio_exports ORDER BY created_at DESC');
      return res.status(200).json({ success: true, exports: result.rows });
    }

    if (req.method === 'POST') {
      if (!(await verifyAdmin(req))) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const body = await parseBody(req);
      const { type, title, payload, metadata = {} } = body;

      if (!type || !title || !payload) {
        return res.status(400).json({ success: false, error: 'type, title, and payload are required.' });
      }

      const result = await pool.query(
        `INSERT INTO studio_exports (type, title, payload, metadata) VALUES ($1, $2, $3, $4) RETURNING *`,
        [type, title, payload, metadata]
      );

      return res.status(201).json({ success: true, export: result.rows[0] });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  } catch (err) {
    console.error('Studio API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
