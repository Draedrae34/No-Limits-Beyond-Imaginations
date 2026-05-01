// api/adaptive-engine.js - NLBL Adaptive Optimization Engine
// Self-tuning logic with safety thresholds and full audit trail
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';
import config from '../adaptive-config.json' with { type: 'json' };

const CONFIG = {
  autoFixEscalatePerHour: 10,
  costSpikePercentage: 50,
  predictionConfidence: 0.8,
  routineDurationIncreasePercent: 30,
  latencyIncreasePercent: 50,
  batchSizeMin: 1,
  batchSizeMax: 10,
  scheduleShiftMaxHours: 2,
  ...config
};

export async function getRecentMetrics(hoursBack = 24) {
  await ensureProductsSchema(pool);
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
  const result = await pool.query(
    `SELECT * FROM routine_logs WHERE created_at >= $1 ORDER BY created_at DESC`,
    [since]
  );
  return result.rows;
}

function predictTrend(values, window = 5) {
  if (values.length < window) return { direction: 'unknown', confidence: 0 };
  const recent = values.slice(0, window);
  const older = values.slice(window, window * 2);
  if (!older.length) return { direction: 'unknown', confidence: 0 };

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  const confidence = Math.min(Math.abs(change) / 10, 1);

  return {
    direction: change > 0 ? 'increasing' : 'decreasing',
    percentChange: change,
    confidence
  };
}

export async function analyzeAndOptimize() {
  await ensureProductsSchema(pool);
  const metrics = await getRecentMetrics(24);
  const decisions = [];
  const escalations = [];

  // 1. Auto-fix storm detection
  const lastHour = metrics.filter(m => new Date(m.created_at) > new Date(Date.now() - 60 * 60 * 1000));
  const recentAutoFixes = lastHour.reduce((sum, m) => sum + (m.auto_fixes || 0), 0);
  if (recentAutoFixes > CONFIG.autoFixEscalatePerHour) {
    escalations.push({
      type: 'auto_fix_storm',
      severity: 'high',
      message: `Auto-fixes: ${recentAutoFixes} in last hour (threshold: ${CONFIG.autoFixEscalatePerHour})`
    });
  } else if (recentAutoFixes > CONFIG.autoFixEscalatePerHour * 0.7) {
    decisions.push({
      type: 'increase_monitoring',
      reason: `Auto-fix rate elevated (${recentAutoFixes}/hr)`,
      action: 'increase_audit_frequency_temporary'
    });
  }

  // 2. Routine duration trend
  const hourlyDurations = metrics
    .filter(m => m.routine_type === 'hourly' && m.duration_ms)
    .map(m => m.duration_ms);
  const durationTrend = predictTrend(hourlyDurations);
  if (durationTrend.direction === 'increasing' && durationTrend.confidence > 0.6) {
    const increasePct = durationTrend.percentChange;
    if (increasePct > CONFIG.routineDurationIncreasePercent) {
      escalations.push({
        type: 'routine_degradation',
        severity: 'medium',
        message: `Hourly routine duration increased ${increasePct.toFixed(1)}% — optimization or schedule adjustment recommended`
      });
    } else {
      decisions.push({
        type: 'schedule_adjustment',
        reason: `Routine slowing (${increasePct.toFixed(1)}%)`,
        action: 'consider_reducing_frequency_or_batch_size'
      });
    }
  }

  // 3. Latency trend from endpoint data (parsed from report if available)
  // For now, we rely on heartbeat alerts; full integration when last_audit stores structured latency

  // 4. Cost trend analysis
  // We'll estimate cost from duration_ms: cost = durationMs * CONFIG.vercelRatePerMs
  const recentCosts = metrics.map(m => ({
    cost: (m.duration_ms || 0) * CONFIG.vercelRatePerMs,
    created_at: m.created_at
  }));
  if (recentCosts.length >= 10) {
    const last10 = recentCosts.slice(0, 10);
    const prev10 = recentCosts.slice(10, 20);
    const avgLast = last10.reduce((a, b) => a + b.cost, 0) / last10.length;
    const avgPrev = prev10.reduce((a, b) => a + b.cost, 0) / prev10.length;
    const costIncrease = ((avgLast - avgPrev) / avgPrev) * 100;
    if (costIncrease > CONFIG.costSpikePercentage) {
      escalations.push({
        type: 'cost_spike',
        severity: 'high',
        message: `Routine costs increased ${costIncrease.toFixed(1)}% ($${avgLast.toFixed(5)}/run avg)`
      });
    }
  }

  // Log decisions
  if (decisions.length || escalations.length) {
    try {
      await pool.query(
        `INSERT INTO optimization_logs (decision_type, reason, action, severity, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          decisions.map(d => d.type).join(', '),
          decisions.map(d => d.reason).join('; '),
          decisions.map(d => d.action).join('; '),
          escalations.length ? 'escalated' : 'auto'
        ]
      );
    } catch (err) {
      console.error('Failed to log optimization decision:', err);
    }
  }

  return {
    ok: true,
    summary: `Analysis complete: ${decisions.length} decisions, ${escalations.length} escalations`,
    decisions,
    escalations
  };
}

// Apply safe auto-tuning actions (non-breaking, reversible)
export async function applyAutoTuning() {
  const tuning = [];
  const metrics = await getRecentMetrics(6);
  const hourlyDurations = metrics.filter(m => m.routine_type === 'hourly' && m.duration_ms).map(m => m.duration_ms);

  if (hourlyDurations.length >= 3) {
    const avg = hourlyDurations.reduce((a, b) => a + b, 0) / hourlyDurations.length;
    if (avg > CONFIG.safeRanges.routineDurationThresholdMs) {
      // If routines consistently slow, we could suggest reducing batch size in config
      tuning.push({
        parameter: 'batch_size',
        current: CONFIG.safeRanges.batchSize.default,
        suggested: Math.max(CONFIG.batchSizeMin, Math.min(CONFIG.batchSizeMax, Math.floor(avg / 5000))),
        reason: `Avg routine duration ${Math.round(avg)}ms exceeds threshold`
      });
    }
  }

  return { ok: true, tuning };
}
