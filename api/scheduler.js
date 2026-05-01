// api/scheduler.js - Dynamic Adaptive Scheduler (DB-backed, Vercel-compatible)
// Reads schedule from adaptive_schedule DB table and auto-adjusts when changed
import cron from 'node-cron';
import { runHourlyRoutine, runNightlyRoutine } from './workshop-routines.js';
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';

let scheduleState = null;
let hourlyJob = null;
let nightlyJob = null;

async function loadSchedule() {
  await ensureProductsSchema(pool);
  const res = await pool.query(`SELECT schedule FROM adaptive_schedule WHERE id = 1`);
  if (res.rows.length === 0) {
    return null;
  }
  const raw = res.rows[0].schedule;
  const schedule = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return schedule;
}

function scheduleJob(name, cronExpression, fn) {
  if (name === 'hourly' && hourlyJob) {
    hourlyJob.destroy();
  } else if (name === 'nightly' && nightlyJob) {
    nightlyJob.destroy();
  }

  const job = cron.schedule(cronExpression, async () => {
    console.log(`[${new Date().toISOString()}] Running ${name} routine...`);
    try {
      const result = await fn();
      console.log(`${name} complete:`, result.summary.slice(0, 200));
    } catch (err) {
      console.error(`${name} routine failed:`, err);
    }
  });

  if (name === 'hourly') hourlyJob = job;
  else if (name === 'nightly') nightlyJob = job;

  return job;
}

function applySchedule(schedule) {
  const hourlyCron = schedule?.schedule?.hourly?.cron;
  const nightlyCron = schedule?.schedule?.nightly?.cron;

  if (!hourlyCron || !nightlyCron) {
    console.error('Invalid schedule config:', schedule);
    return false;
  }

  console.log(`Applying schedule: hourly=${hourlyCron} nightly=${nightlyCron}`);

  scheduleJob('hourly', hourlyCron, runHourlyRoutine);
  scheduleJob('nightly', nightlyCron, () => runNightlyRoutine({ rotateFeatured: true, applyMargin: false, generateProducts: false }));

  return true;
}

async function init() {
  console.log('🤖 Lil Mystic Adaptive Scheduler starting...');
  await ensureProductsSchema(pool);

  scheduleState = await loadSchedule();
  if (!scheduleState) {
    scheduleState = {
      schedule: {
        hourly: { cron: '0 * * * *' },
        nightly: { cron: '0 2 * * *' }
      },
      history: []
    };
  }

  applySchedule(scheduleState);

  // Poll for schedule changes every 30 seconds
  setInterval(async () => {
    try {
      const newSchedule = await loadSchedule();
      if (!newSchedule) return;

      const oldCron = scheduleState?.schedule?.hourly?.cron;
      const newCron = newSchedule?.schedule?.hourly?.cron;

      if (newCron && oldCron && newCron !== oldCron) {
        console.log(`Schedule change detected: ${oldCron} → ${newCron}`);
        applySchedule(newSchedule);
        scheduleState = newSchedule;
      }
    } catch (err) {
      console.warn('Schedule watch error:', err.message);
    }
  }, 30000);

  console.log('✅ Adaptive Scheduler active — watching for adjustments');
}

init();
