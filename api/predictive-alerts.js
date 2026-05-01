// api/predictive-alerts.js - Forecasting and early warning system
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';

export async function getLatencyHistory(hours = 24) {
  await ensureProductsSchema(pool);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  // Extract latency from routine logs where endpoints were checked
  const result = await pool.query(
    `SELECT report, created_at FROM routine_logs WHERE created_at >= $1 AND report LIKE '%latency:%' ORDER BY created_at DESC`,
    [since]
  );
  const history = [];
  result.rows.forEach(row => {
    // Parse latency values from report lines like "shop: OK (120ms)"
    const lines = row.report.split('\n');
    lines.forEach(line => {
      const match = line.match(/(\w+):.*?(\d+)ms/);
      if (match) {
        history.push({
          endpoint: match[1],
          latency: parseInt(match[2]),
          created_at: row.created_at
        });
      }
    });
  });
  return history;
}

function predictNextValue(history, key = 'latency', window = 6) {
  if (history.length < window * 2) return { predicted: null, confidence: 0, message: 'insufficient data' };

  const values = history.map(h => h[key]);
  const recent = values.slice(0, window);
  const prev = values.slice(window, window * 2);

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const prevAvg = prev.reduce((a, b) => a + b, 0) / prev.length;
  const trendSlope = (recentAvg - prevAvg) / prevAvg;

  // Simple linear extrapolation
  const predicted = recentAvg * (1 + trendSlope);
  const confidence = Math.min(Math.abs(trendSlope) * 2, 1);

  return { predicted, confidence, trend: trendSlope > 0 ? 'up' : 'down' };
}

export async function generatePredictions() {
  const latencyHistory = await getLatencyHistory(24);
  const predictions = [];

  // Group by endpoint
  const byEndpoint = {};
  latencyHistory.forEach(h => {
    if (!byEndpoint[h.endpoint]) byEndpoint[h.endpoint] = [];
    byEndpoint[h.endpoint].push(h);
  });

  for (const [endpoint, history] of Object.entries(byEndpoint)) {
    const pred = predictNextValue(history);
    if (pred.confidence > 0.5 && pred.predicted) {
      let alert = null;
      if (pred.predicted > 800) {
        alert = {
          endpoint,
          predictedLatency: Math.round(pred.predicted),
          confidence: pred.confidence,
          severity: 'high',
          message: `${endpoint} latency predicted to exceed 800ms within 6 hours (current trend: ${(pred.trend === 'up' ? '+' : '')}${(pred.predicted - history[0].latency).toFixed(0)}ms)`
        };
      } else if (pred.predicted > 500) {
        alert = {
          endpoint,
          predictedLatency: Math.round(pred.predicted),
          confidence: pred.confidence,
          severity: 'medium',
          message: `${endpoint} latency trending upward. Predicted: ${Math.round(pred.predicted)}ms`
        };
      }
      if (alert) predictions.push(alert);
    }
  }

  // Catalog sync failure prediction
  // If catalog count consistently 0 or decreasing
  const catalogHistory = await pool.query(
    `SELECT report, created_at FROM routine_logs WHERE report LIKE '%catalog%' ORDER BY created_at DESC LIMIT 12`
  );
  const catalogCounts = [];
  catalogHistory.rows.forEach(row => {
    const match = row.report.match(/catalog healthy \((\d+) items\)/);
    if (match) catalogCounts.push({ count: parseInt(match[1]), created_at: row.created_at });
  });
  if (catalogCounts.length >= 6) {
    const recent = catalogCounts.slice(0, 3).map(c => c.count);
    const older = catalogCounts.slice(3, 6).map(c => c.count);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    if (recentAvg < olderAvg * 0.7) {
      predictions.push({
        type: 'catalog_decline',
        severity: 'high',
        message: `Catalog count dropped ${Math.round((1 - recentAvg/olderAvg)*100)}% — sync failure likely tonight`
      });
    }
  }

  return { ok: true, predictions };
}

export async function getOptimizationSuggestions() {
  const metrics = await getRecentMetrics(24);
  const suggestions = [];

  // If routines consistently slow, suggest batch reduction
  const hourlyDurations = metrics.filter(m => m.routine_type === 'hourly' && m.duration_ms).map(m => m.duration_ms);
  if (hourlyDurations.length >= 5) {
    const avg = hourlyDurations.reduce((a, b) => a + b, 0) / hourlyDurations.length;
    if (avg > 30000) {
      suggestions.push({
        category: 'performance',
        priority: 'high',
        message: `Average routine duration ${Math.round(avg/1000)}s exceeds healthy threshold. Consider reducing batch sizes or increasing schedule interval.`,
        action: 'reduce_batch_size_or_increase_interval'
      });
    }
  }

  // If auto-fixes frequent, suggest deep audit
  const autoFixRate = metrics.reduce((sum, m) => sum + (m.auto_fixes || 0), 0) / (metrics.length || 1);
  if (autoFixRate > 0.5) {
    suggestions.push({
      category: 'stability',
      priority: 'high',
      message: `Auto-fixes occurring in ${(autoFixRate*100).toFixed(0)}% of routine runs. System instability detected — run deep audit and review error logs.`,
      action: 'run_deep_audit'
    });
  }

  return { ok: true, suggestions };
}
