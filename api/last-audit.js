// api/last-audit.js
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Auth
  const cookies = req.headers.cookie || '';
  const isAuth = cookies.split(';').some(c => c.trim() === 'nlbl_auth=authenticated');
  if (!isAuth) return res.status(401).json({ error: 'Authentication required' });

  try {
    await ensureProductsSchema(pool);
    const result = await pool.query(
      `SELECT report, created_at FROM routine_logs 
       WHERE report LIKE '%endpoints:%' 
       ORDER BY created_at DESC LIMIT 1`
    );
    if (!result.rows.length) {
      return res.status(200).json({ message: 'No audit logs found', endpoints: {} });
    }

    // Parse report to extract endpoint data
    const report = result.rows[0].report;
    const endpoints = {};
    const endpointLines = report.split('\n').filter(l => l.includes('shop:') || l.includes('printify-status:') || l.includes('products-list:') || l.includes('messages:') || l.includes('orders:'));
    endpointLines.forEach(line => {
      const match = line.match(/(\w+):\s*(OK|ERROR \d+|FAIL:[^,]+),\s*(\d+)ms/);
      if (match) {
        endpoints[match[1]] = { status: match[2], latency: parseInt(match[3]) };
      }
    });

    return res.status(200).json({
      endpoints,
      last_run: result.rows[0].created_at
    });
  } catch (err) {
    console.error('last-audit error:', err);
    return res.status(500).json({ error: err.message });
  }
}
