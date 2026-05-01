// api/resource-tracker.js - Execution time, memory, and cost analytics
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';

const VERCEL_RATE_PER_MS = 0.0000002; // approximate

export function getCurrentResourceUsage() {
  const mem = process.memoryUsage();
  return {
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100 + ' MB',
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100 + ' MB',
    rss: Math.round(mem.rss / 1024 / 1024 * 100) / 100 + ' MB',
    external: Math.round(mem.external / 1024 / 1024 * 100) / 100 + ' MB',
    timestamp: new Date().toISOString()
  };
}

export async function getRoutineCostStats(days = 30) {
  await ensureProductsSchema(pool);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const result = await pool.query(
    `SELECT routine_type, duration_ms, created_at FROM routine_logs WHERE created_at >= $1`,
    [since]
  );
  const rows = result.rows;

  const byType = {};
  rows.forEach(r => {
    if (!byType[r.routine_type]) byType[r.routine_type] = [];
    byType[r.routine_type].push(r.duration_ms);
  });

  const stats = {};
  for (const [type, durations] of Object.entries(byType)) {
    const totalMs = durations.reduce((a, b) => a + b, 0);
    const avgMs = totalMs / durations.length;
    const costPerRun = avgMs * VERCEL_RATE_PER_MS;
    const estimatedMonthly = (costPerRun * 30 * 24) / (type === 'hourly' ? 1 : type === 'nightly' ? 1 : 1);
    stats[type] = {
      runs: durations.length,
      avgDurationMs: Math.round(avgMs),
      costPerRun: costPerRun,
      estimatedMonthlyUSD: estimatedMonthly
    };
  }

  const totalCost = Object.values(stats).reduce((sum, s) => sum + (s.costPerRun * (s.runs || 1)), 0);

  return {
    ok: true,
    stats,
    totalCost,
    periodDays: days,
    ratePerMs: VERCEL_RATE_PER_MS
  };
}

export async function getSystemHealthScore() {
  const metrics = await getRecentMetrics(24);
  if (!metrics.length) return { score: 0, grade: 'N/A' };

  let score = 100;

  // Deduct for failed routines
  const failedRuns = metrics.filter(m => !m.report?.startsWith?.(['✅', '▶'])).length;
  score -= failedRuns * 5;

  // Deduct for high auto-fix rate
  const totalAutoFixes = metrics.reduce((sum, m) => sum + (m.auto_fixes || 0), 0);
  score -= Math.min(totalAutoFixes * 2, 20);

  // Deduct for slow routines
  const slowRuns = metrics.filter(m => m.duration_ms > 30000).length;
  score -= Math.min(slowRuns * 3, 30);

  score = Math.max(0, score);
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

  return { score: Math.round(score), grade };
}

async function getRecentMetrics(hours) {
  // Reuse from adaptive-engine if available, else stub
  await ensureProductsSchema(pool);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const result = await pool.query(
    `SELECT * FROM routine_logs WHERE created_at >= $1 ORDER BY created_at DESC`,
    [since]
  );
  return result.rows;
}

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

  const { action } = req.query;

  if (action === 'cost') {
    const days = parseInt(req.query.days) || 30;
    const costStats = await getRoutineCostStats(days);
    return res.status(200).json(costStats);
  }

  if (action === 'health') {
    const health = await getSystemHealthScore();
    return res.status(200).json(health);
  }

  if (action === 'resources') {
    const usage = getCurrentResourceUsage();
    return res.status(200).json(usage);
  }

  return res.status(400).json({ error: 'Specify action=cost|health|resources' });
}
