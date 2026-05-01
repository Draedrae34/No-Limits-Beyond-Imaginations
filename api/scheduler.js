// api/scheduler.js - Dynamic Adaptive Scheduler
// Reads schedule from adaptive-schedule.json and auto-adjusts when file changes
import cron from 'node-cron';
import { runHourlyRoutine, runNightlyRoutine } from './workshop-routines.js';
import fs from 'fs/promises';
import path from 'path';

const SCHEDULE_PATH = path.join(process.cwd(), 'adaptive-schedule.json');

let scheduleState = null;
let hourlyJob = null;
let nightlyJob = null;

async function loadSchedule() {
  try {
    const raw = await fs.readFile(SCHEDULE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load adaptive schedule:', err);
    return null;
  }
}

function scheduleJob(name, cronExpression, fn) {
  // Clear existing
  if (name === 'hourly' && hourlyJob) {
    hourlyJob.destroy();
  } else if (name === 'nightly' && nightlyJob) {
    nightlyJob.destroy();
  }

  // Create new job
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

  // Load initial schedule
  scheduleState = await loadSchedule();
  if (!scheduleState) {
    // Fallback to defaults
    scheduleState = {
      schedule: {
        hourly: { cron: '0 * * * *' },
        nightly: { cron: '0 2 * * *' }
      }
    };
  }

  applySchedule(scheduleState);

  // Watch for schedule changes (poll every 30 seconds)
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
