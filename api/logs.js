// api/logs.js - Unified System Logs Endpoint (Cosmic NLBL Theme)
// Actions: optimization, routine, audit
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';
import { sendDiscordAlert } from '../utils/discord-alerts.js';
import { verifyAdmin } from '../src/utils/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Auth
  if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Authentication required' });

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

      // Check for recent failures and alert to Discord
      const failures = result.rows.filter(r => r.auto_fixes > 0 || r.duration_ms > 30000);
      if (failures.length > 0) {
        await sendDiscordAlert('warning', 'Routine Logs Report — Issues Detected', [
          { name: 'Routines Reviewed', value: String(result.rows.length), inline: true },
          { name: 'Issues Found', value: String(failures.length), inline: true },
          { name: 'Most Recent', value: failures[0].routine_type, inline: true }
        ], `Recent routine runs show ${failures.length} issue(s) with auto-fixes or slow steps. Review logs.`);
      }

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

      const failures = Object.entries(endpoints).filter(([k, v]) => v.status !== 'OK');
      if (failures.length > 0) {
        await sendDiscordAlert('warning', 'Audit Endpoint Failures',
          failures.map(([k, v]) => ({ name: k, value: `${v.status} (${v.latency}ms)`, inline: true })),
          `Endpoint health check found ${failures.length} failing endpoints.`
        );
      }

      console.log(`🌌 [NLBL Logs] Audit: ${Object.keys(endpoints).length} endpoints checked`);
      return res.status(200).json({ endpoints, last_run: result.rows[0].created_at });
    }

    return res.status(400).json({
      error: 'Specify action=optimization|routine|audit',
      availableActions: ['optimization', 'routine', 'audit']
    });
  } catch (err) {
    console.error('🌌 [NLBL Logs] Error:', err);
    
    await sendDiscordAlert('error', 'Logs Endpoint Failure', [
      { name: 'Action', value: action || 'none', inline: true },
      { name: 'Error', value: err.message.slice(0,200), inline: false }
    ], `Failed to fetch logs. Database or schema may have issues.`);
    
    return res.status(500).json({ error: err.message });
  }
}
