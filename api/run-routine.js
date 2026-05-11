// api/run-routine.js
// Vercel Cron endpoint — triggers scheduled routines on demand
import { runHourlyRoutine, runNightlyRoutine } from '../src/workshop-routines.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth for cron endpoint (Vercel sends secret in x-vercel-cron-secret)
  const secret = req.headers['x-vercel-cron-secret'] || req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: 'Invalid cron secret' });
  }

  const { routine = 'hourly' } = req.body || {};

  try {
    let result;
    if (routine === 'nightly') {
      result = await runNightlyRoutine({ rotateFeatured: true });
    } else {
      result = await runHourlyRoutine();
    }

    return res.status(200).json({
      success: true,
      routine,
      summary: result.summary,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Scheduled routine error:', err);
    return res.status(500).json({ error: err.message });
  }
}
