// api/routine-logs.js
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Auth check
  const cookies = req.headers.cookie || '';
  const isAuth = cookies.split(';').some(c => c.trim() === 'nlbl_auth=authenticated');
  if (!isAuth) return res.status(401).json({ error: 'Authentication required' });

  try {
    await ensureProductsSchema(pool);
    const limit = parseInt(req.query.limit) || 10;
    const result = await pool.query(
      `SELECT id, routine_type, created_at, LEFT(report, 500) as report_preview 
       FROM routine_logs 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );
    return res.status(200).json({ logs: result.rows });
  } catch (err) {
    console.error('Failed to fetch routine logs:', err);
    return res.status(500).json({ error: err.message });
  }
}
