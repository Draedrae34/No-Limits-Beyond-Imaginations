// api/adaptive-engine.js - NLBL Adaptive Optimization Engine (Auto-Tuning)
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';
import { applyBatchSizeAdjustment, applyScheduleAdjustment, applyCacheModeToggle, getCurrentOptimizationState } from './auto-tuner.js';
import { runBatchOptimization } from './ai-optimizer.js';

const CONFIG = {
  autoFixEscalatePerHour: 10,
  costSpikePercentage: 50,
  predictionConfidence: 0.8,
  routineDurationIncreasePercent: 30,
  latencyIncreasePercent: 50,
  batchSizeMin: 1,
  batchSizeMax: 10,
  scheduleShiftMaxHours: 2,
  cacheLatencyThresholdMs: 800,
  cacheRecoveryLatencyMs: 300,
  cacheConsecutiveChecks: 3,
  routineDurationThresholdMs: 30000,
  aiOptimizationPerRun: 5,
  maxAutoPriceAdjustmentPercent: 20
};

async function getRecentMetrics(hoursBack = 24) {
  await ensureProductsSchema(pool);
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
  const result = await pool.query(
    `SELECT * FROM routine_logs WHERE created_at >= $1 ORDER BY created_at DESC`,
    [since]
  );
  return result.rows;
}

async function getRecentLatencies(hours = 1) {
  const metrics = await getRecentMetrics(hours);
  const latencies = [];
  metrics.forEach(m => {
    const lines = (m.report || '').split('\n');
    lines.forEach(line => {
      const match = line.match(/(\w+):.*?(\d+)ms/);
      if (match) latencies.push(parseInt(match[2]));
    });
  });
  return latencies;
}

async function analyzeAndOptimize() {
  await ensureProductsSchema(pool);
  const metrics = await getRecentMetrics(24);
  const applied = [];
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
  }

  // 2. Batch size auto-tuning
  const hourlyDurations = metrics
    .filter(m => m.routine_type === 'hourly' && m.duration_ms)
    .map(m => m.duration_ms);
  if (hourlyDurations.length >= 3) {
    const avgDuration = hourlyDurations.reduce((a, b) => a + b, 0) / hourlyDurations.length;
    const state = await getCurrentOptimizationState();
    const currentBatchSize = state?.config?.safeRanges?.batchSize?.default || 5;

    if (avgDuration > CONFIG.routineDurationThresholdMs && currentBatchSize > CONFIG.batchSizeMin) {
      const newSize = Math.max(CONFIG.batchSizeMin, currentBatchSize - 1);
      const result = await applyBatchSizeAdjustment(newSize);
      if (result.ok) {
        applied.push(`Batch size ${currentBatchSize} → ${newSize} (avg ${Math.round(avgDuration)}ms)`);
      }
    } else if (avgDuration < 10000 && currentBatchSize < CONFIG.batchSizeMax) {
      const newSize = Math.min(CONFIG.batchSizeMax, currentBatchSize + 1);
      const result = await applyBatchSizeAdjustment(newSize);
      if (result.ok) {
        applied.push(`Batch size ${currentBatchSize} → ${newSize} (avg ${(avgDuration/1000).toFixed(1)}s)`);
      }
    }
  }

  // 3. Cache mode auto-toggle
  const recentLatencies = await getRecentLatencies(1);
  if (recentLatencies.length >= CONFIG.cacheConsecutiveChecks) {
    const avgLatency = recentLatencies.slice(0, CONFIG.cacheConsecutiveChecks).reduce((a, b) => a + b, 0) / CONFIG.cacheConsecutiveChecks;
    const state = await getCurrentOptimizationState();
    const cacheEnabled = state?.cacheMode === 'enabled';

    if (avgLatency > CONFIG.cacheLatencyThresholdMs && !cacheEnabled) {
      const result = await applyCacheModeToggle(true);
      if (result.ok) {
        applied.push('Cache mode ENABLED due to high latency');
      }
    } else if (avgLatency < CONFIG.cacheRecoveryLatencyMs && cacheEnabled) {
      const result = await applyCacheModeToggle(false);
      if (result.ok) {
        applied.push('Cache mode DISABLED — latency recovered');
      }
    }
  }

  // 4. Schedule adjustment
  const hourlyCount = metrics.filter(m => m.routine_type === 'hourly').length;
  if (hourlyCount >= 6) {
    const avgHourlyDuration = metrics
      .filter(m => m.routine_type === 'hourly')
      .slice(0, 6)
      .reduce((a, b) => a + b.duration_ms, 0) / 6;
    if (avgHourlyDuration > CONFIG.routineDurationThresholdMs * 1.5) {
      const schedule = await (await import('./auto-tuner.js')).getCurrentOptimizationState();
      if (schedule?.schedule?.hourly?.cron === '0 * * * *') {
        const result = await applyScheduleAdjustment('hourly', '0 */2 * * *', `Duration ${Math.round(avgHourlyDuration)}ms exceeds threshold`);
        if (result.ok) {
          applied.push('Hourly schedule adjusted: every 2 hours');
        }
      }
    }
  }

  // 5. AI product optimization (safe subset)
  try {
    const aiResult = await runBatchOptimization(CONFIG.aiOptimizationPerRun);
    if (aiResult.ok && aiResult.optimized > 0) {
      applied.push(`AI optimized ${aiResult.optimized} products (descriptions, categories, pricing)`);
    }
  } catch (err) {
    console.error('AI optimization failed:', err.message);
  }

  // Log
  if (applied.length || escalations.length) {
    try {
      await pool.query(
        `INSERT INTO optimization_logs (decision_type, reason, action, severity, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          'auto_tuning',
          `Auto-tuning cycle: ${applied.length} actions, ${escalations.length} escalations`,
          applied.join('; '),
          escalations.length ? 'escalated' : 'auto'
        ]
      );
    } catch (err) {
      console.error('Failed to log optimization:', err.message);
    }
  }

  return {
    ok: true,
    summary: `Auto-tuning: ${applied.length} optimizations applied${escalations.length ? `, ${escalations.length} escalations` : ''}`,
    applied,
    escalations
  };
}

export async function getAutoTuningStatus() {
  const state = await getCurrentOptimizationState();
  return {
    ok: true,
    state,
    lastRun: new Date().toISOString()
  };
}
