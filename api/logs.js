// api/logs.js - Unified System Logs Endpoint (Cosmic NLBL Theme)
// Actions: optimization, routine, audit
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';
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

  const { action, limit } = req.query;
  const limitVal = parseInt(limit) || 10;

  try {
    await ensureProductsSchema(pool);

    if (action === 'optimization') {
      const result = await pool.query(
        `SELECT decision_type, severity, reason, action, created_at
         FROM optimization_logs
         ORDER BY created_at DESC
         LIMIT $1`,
        [limitVal]
      );
      console.log(`🌌 [NLBL Logs] Optimization: ${result.rows.length} entries`);
      return res.status(200).json({ logs: result.rows });
    }

    if (action === 'routine') {
      const result = await pool.query(
        `SELECT id, routine_type, created_at,
                duration_ms, slowest_step, auto_fixes,
                LEFT(report, 600) as report_preview
         FROM routine_logs
         ORDER BY created_at DESC
         LIMIT $1`,
        [limitVal]
      );
      console.log(`🌌 [NLBL Logs] Routine: ${result.rows.length} entries`);
      return res.status(200).json({ logs: result.rows });
    }

    if (action === 'audit') {
      const result = await pool.query(
        `SELECT report, created_at
         FROM routine_logs
         WHERE report LIKE '%endpoints:%'
         ORDER BY created_at DESC
         LIMIT 1`
      );
      if (!result.rows.length) {
        return res.status(200).json({ message: 'No audit logs found', endpoints: {} });
      }

      const report = result.rows[0].report;
      const endpoints = {};
      const endpointLines = report.split('\n').filter(l =>
        l.includes('shop:') || l.includes('printify-status:') ||
        l.includes('products-list:') || l.includes('messages:') || l.includes('orders:')
      );
      endpointLines.forEach(line => {
        const match = line.match(/(\w+):\s*(OK|ERROR \d+|FAIL:[^,]+),\s*(\d+)ms/);
        if (match) {
          endpoints[match[1]] = { status: match[2], latency: parseInt(match[3]) };
        }
      });

      console.log(`🌌 [NLBL Logs] Audit: ${Object.keys(endpoints).length} endpoints checked`);
      return res.status(200).json({ endpoints, last_run: result.rows[0].created_at });
    }

    return res.status(400).json({
      error: 'Specify action=optimization|routine|audit',
      availableActions: ['optimization', 'routine', 'audit']
    });
  } catch (err) {
    console.error('🌌 [NLBL Logs] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
