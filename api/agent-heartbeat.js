// api/agent-heartbeat.js - Workshop Intelligence Layer v2 (Performance Aware)
// Monitors: health, latency, trends, auto-fix frequency
import printify from './printify.js';
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';
import { loadLogos } from '../utils/logo-loader.js';
import fs from 'fs/promises';
import path from 'path';

const ENDPOINTS_TO_CHECK = [
  '/api/printify?action=status',
  '/api/shop',
  '/api/orders',
  '/api/messages',
  '/api/gallery',
  '/api/routine-logs'
];

async function measureLatency(url) {
  const start = Date.now();
  try {
    const res = await fetch(url, { method: 'GET' });
    const latency = Date.now() - start;
    return { url, ok: res.ok, latency, status: res.status };
  } catch (err) {
    return { url, ok: false, latency: Date.now() - start, error: err.message };
  }
}

async function checkEndpointLatencies() {
  const results = await Promise.all(ENDPOINTS_TO_CHECK.map(url => measureLatency(url)));
  const slow = results.filter(r => r.latency > 500);
  const errors = results.filter(r => !r.ok);
  return { results, slow, errors };
}

async function getRecentRoutineStats() {
  try {
    await ensureProductsSchema(pool);
    const lastHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recent = await pool.query(
      `SELECT routine_type, duration_ms, auto_fixes, created_at, slowest_step
       FROM routine_logs 
       WHERE created_at >= $1
       ORDER BY created_at DESC`,
      [lastHour]
    );

    const hourly = recent.rows.filter(r => r.routine_type === 'hourly');
    const nightly = recent.rows.filter(r => r.routine_type === 'nightly');

    const avgDuration = (rows) => {
      if (!rows.length) return null;
      const sum = rows.reduce((acc, r) => acc + (r.duration_ms || 0), 0);
      return Math.round(sum / rows.length);
    };

    return {
      hourlyCount: hourly.length,
      nightlyCount: nightly.length,
      avgHourlyDuration: avgDuration(hourly),
      avgNightlyDuration: avgDuration(nightly),
      recentAutoFixes: recent.rows.reduce((acc, r) => acc + (r.auto_fixes || 0), 0),
      latestSlowest: recent.rows[0]?.slowest_step || null
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function checkPrintifyHealth() {
  const start = Date.now();
  try {
    const status = await printify('status');
    const latency = Date.now() - start;
    if (!status?.ok && status?.status !== 'not_configured') {
      return { ok: false, message: 'Printify API unhealthy', latency };
    }
    return { ok: true, shopId: status?.shop?.id, latency };
  } catch (err) {
    return { ok: false, message: `Printify unreachable: ${err.message}`, latency: Date.now() - start };
  }
}

async function checkCatalogFreshness() {
  const start = Date.now();
  try {
    const data = await printify('catalog');
    const latency = Date.now() - start;
    const count = data?.catalog?.length || 0;
    if (count === 0) return { ok: false, message: 'Catalog empty — sync needed', latency };
    if (count < 5) return { ok: false, message: `Catalog thin (${count} items)`, latency };
    return { ok: true, count, latency };
  } catch (err) {
    return { ok: false, message: `Catalog fetch failed: ${err.message}`, latency: Date.now() - start };
  }
}

async function checkLocalProducts() {
  const start = Date.now();
  try {
    await ensureProductsSchema(pool);
    const res = await pool.query('SELECT COUNT(*)::int AS count FROM products');
    const latency = Date.now() - start;
    return { ok: true, count: res.rows[0].count, latency };
  } catch (err) {
    return { ok: false, message: `DB error: ${err.message}`, latency: Date.now() - start };
  }
}

async function checkDesignFiles() {
  const start = Date.now();
  try {
    const logos = loadLogos();
    const latency = Date.now() - start;
    if (!logos.length) return { ok: false, message: 'No design files found', latency };
    return { ok: true, count: logos.length, latency };
  } catch (err) {
    return { ok: false, message: `Design scan failed: ${err.message}`, latency: Date.now() - start };
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Auth
  const cookies = req.headers.cookie || '';
  const isAuth = cookies.split(';').some(c => c.trim() === 'nlbl_auth=authenticated');
  if (!isAuth) return res.status(401).json({ error: 'Authentication required' });

  const alerts = [];
  const checks = {};

  // Run health + latency checks in parallel
  const [
    printifyStatus,
    catalogHealth,
    localProducts,
    designFiles,
    endpointLatencies,
    routineStats
  ] = await Promise.all([
    checkPrintifyHealth(),
    checkCatalogFreshness(),
    checkLocalProducts(),
    checkDesignFiles(),
    checkEndpointLatencies(),
    getRecentRoutineStats()
  ]);

  // Evaluate health
  if (!printifyStatus.ok) alerts.push({ type: 'error', message: printifyStatus.message }); else checks.printify = { ...printifyStatus };
  if (!catalogHealth.ok) alerts.push({ type: 'warning', message: catalogHealth.message }); else checks.catalog = { ...catalogHealth };
  if (!localProducts.ok) alerts.push({ type: 'error', message: localProducts.message }); else {
    checks.products = localProducts;
    if (localProducts.count === 0) alerts.push({ type: 'warning', message: 'No local products in database' });
  }
  if (!designFiles.ok) alerts.push({ type: 'error', message: designFiles.message }); else checks.designs = { ...designFiles };

  // Latency alerts
  endpointLatencies.slow.forEach(e => {
    alerts.push({ type: 'warning', message: `Slow endpoint: ${e.url} (${e.latency}ms)` });
  });
  endpointLatencies.errors.forEach(e => {
    alerts.push({ type: 'error', message: `Endpoint error: ${e.url} (${e.status || e.error})` });
  });
  checks.latency = {
    avg: Math.round(endpointLatencies.results.reduce((a, r) => a + r.latency, 0) / endpointLatencies.results.length),
    max: Math.max(...endpointLatencies.results.map(r => r.latency)),
    slowCount: endpointLatencies.slow.length,
    errorCount: endpointLatencies.errors.length
  };

  // Routine performance
  checks.routines = routineStats;

  // Trend alerts
  if (routineStats.avgHourlyDuration && routineStats.avgHourlyDuration > 10000) {
    alerts.push({ type: 'warning', message: `Hourly routines avg ${(routineStats.avgHourlyDuration / 1000).toFixed(1)}s — consider optimization` });
  }
  if (routineStats.recentAutoFixes > 5) {
    alerts.push({ type: 'warning', message: `High auto-fix activity: ${routineStats.recentAutoFixes} fixes in last hour` });
  }

  // Health summary
  const errorCount = alerts.filter(a => a.type === 'error').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;
  const health = errorCount ? 'critical' : warningCount ? 'degraded' : 'healthy';

  return res.json({
    health,
    summary: `${alerts.length} active alert${alerts.length === 1 ? '' : 's'}`,
    alerts,
    checks,
    timestamp: new Date().toISOString()
  });
}
