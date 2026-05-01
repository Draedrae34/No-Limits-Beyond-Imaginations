// api/agent-heartbeat.js - Workshop Intelligence Layer
// Proactive monitoring: catalog sync health, DB counts, design files, endpoint latency
import printify from './printify.js';
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';
import { loadLogos } from '../utils/logo-loader.js';
import fs from 'fs/promises';
import path from 'path';

function checkPrintifyHealth() {
  return printify('status').then(status => {
    if (!status?.ok && status?.status !== 'not_configured') {
      return { ok: false, message: 'Printify API unhealthy' };
    }
    return { ok: true, shopId: status?.shop?.id };
  }).catch(err => ({ ok: false, message: `Printify unreachable: ${err.message}` }));
}

function checkCatalogFreshness() {
  return printify('catalog').then(data => {
    const count = data?.catalog?.length || 0;
    if (count === 0) return { ok: false, message: 'Catalog empty — sync needed' };
    if (count < 5) return { ok: false, message: `Catalog thin (${count} items)` };
    return { ok: true, count };
  }).catch(err => ({ ok: false, message: `Catalog fetch failed: ${err.message}` }));
}

function checkLocalProducts() {
  return ensureProductsSchema(pool).then(() => 
    pool.query('SELECT COUNT(*)::int AS count FROM products')
      .then(res => ({ ok: true, count: res.rows[0].count }))
      .catch(err => ({ ok: false, message: `DB error: ${err.message}` }))
  );
}

function checkGibberishProducts() {
  return ensureProductsSchema(pool).then(() =>
    pool.query('SELECT name FROM products')
      .then(res => {
        const gibberish = res.rows.filter(r => {
          const name = r.name || '';
          if (name.length < 4) return true;
          if (/[^a-zA-Z0-9\s]/.test(name)) return false;
          if (/\s/.test(name)) return false;
          if (/[AEIOUaeiou]/.test(name)) return false;
          if (name === name.toUpperCase() && name.length <= 6) return false;
          return true;
        });
        return { ok: true, count: gibberish.length };
      })
      .catch(err => ({ ok: false, message: `Gibberish scan failed: ${err.message}` }))
  );
}

function checkDesignFiles() {
  return loadLogos().then(logos => {
    if (!logos.length) return { ok: false, message: 'No design files found' };
    return { ok: true, count: logos.length };
  }).catch(err => ({ ok: false, message: `Design scan failed: ${err.message}` }));
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Auth required
  const cookies = req.headers.cookie || '';
  const isAuth = cookies.split(';').some(c => c.trim() === 'nlbl_auth=authenticated');
  if (!isAuth) return res.status(401).json({ error: 'Authentication required' });

  const alerts = [];
  const checks = {};

  // Run checks in parallel
  const [
    printifyStatus,
    catalogHealth,
    localProducts,
    gibberishCheck,
    designFiles
  ] = await Promise.all([
    checkPrintifyHealth(),
    checkCatalogFreshness(),
    checkLocalProducts(),
    checkGibberishProducts(),
    checkDesignFiles()
  ]);

  // Evaluate + assemble alerts
  if (!printifyStatus.ok) alerts.push({ type: 'error', message: printifyStatus.message }); else checks.printify = printifyStatus;
  if (!catalogHealth.ok) alerts.push({ type: 'warning', message: catalogHealth.message }); else checks.catalog = catalogHealth;
  if (!localProducts.ok) alerts.push({ type: 'error', message: localProducts.message }); else {
    checks.products = localProducts;
    if (localProducts.count === 0) alerts.push({ type: 'warning', message: 'No local products in database' });
  }
  if (gibberishCheck.ok && gibberishCheck.count > 0) alerts.push({ type: 'info', message: `${gibberishCheck.count} gibberish products detected — say “clean gibberish”` });
  if (!designFiles.ok) alerts.push({ type: 'error', message: designFiles.message }); else checks.designs = designFiles;

  // Health summary
  const errorCount = alerts.filter(a => a.type === 'error').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;
  const infoCount = alerts.filter(a => a.type === 'info').length;
  const health = errorCount ? 'critical' : warningCount ? 'degraded' : infoCount ? 'noticing' : 'healthy';

  return res.json({
    health,
    summary: `${alerts.length} active alert${alerts.length === 1 ? '' : 's'}`,
    alerts,
    checks,
    timestamp: new Date().toISOString()
  });
}
