// api/scheduler.js
// Run this file as a background process: node api/scheduler.js
import cron from 'node-cron';
import { runHourlyRoutine, runNightlyRoutine } from './workshop-routines.js';

console.log('🤖 Lil Mystic Scheduler starting...');

// Hourly at minute 0
cron.schedule('0 * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running hourly routine...`);
  try {
    const result = await runHourlyRoutine();
    console.log('Hourly complete:', result.summary.slice(0, 200));
  } catch (err) {
    console.error('Hourly routine failed:', err);
  }
});

// Nightly at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running nightly routine...`);
  try {
    const result = await runNightlyRoutine({ rotateFeatured: true, applyMargin: false, generateProducts: false });
    console.log('Nightly complete:', result.summary.slice(0, 200));
  } catch (err) {
    console.error('Nightly routine failed:', err);
  }
});

console.log('✅ Scheduler active — hourly + nightly routines loaded');
