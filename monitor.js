// monitor.js - Production error monitoring for NLBL
// Run: DISCORD_WEBHOOK_URL=your_url node monitor.js
// Or: set in .env and use `node monitor.js`

const { exec } = require('child_process');
const { sendDiscordAlert } = require('./utils/discord-alerts');

const CONFIG = {
  domain: process.env.NLBL_DOMAIN || 'localhost:3001',
  vercelProjectId: process.env.VERCEL_PROJECT_ID || null,
  vercelTeamId: process.env.VERCEL_TEAM_ID || null,
  interval: 60000, // 1 minute
  errorThreshold: 3, // alert if >3 errors in interval
  silentHours: ['23:00-05:00'] // optional quiet period
};

let errorHistory = [];
let lastCheckTime = Date.now();

function isSilentHour() {
  const hour = new Date().getHours();
  return CONFIG.silentHours.some(range => {
    const [start, end] = range.split('-').map(Number);
    return hour >= start && hour < end;
  });
}

async function checkVercelLogs() {
  if (!CONFIG.vercelProjectId) {
    console.log('⚠️  VERCEL_PROJECT_ID not set — skipping Vercel log check');
    return;
  }

  return new Promise((resolve) => {
    const cmd = `vercel logs --project ${CONFIG.vercelProjectId} --since 5m --output json`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error('Failed to fetch Vercel logs:', err.message);
        return resolve([]);
      }

      try {
        const logs = JSON.parse(stdout);
        const errors = logs.filter(l => 
          l.level === 'error' || 
          l.message?.includes('500') ||
          l.status === 500
        );
        resolve(errors);
      } catch (e) {
        console.error('Log parse error:', e.message);
        resolve([]);
      }
    });
  });
}

async function checkEndpointHealth() {
  const base = `https://${CONFIG.domain}`;
  const endpoints = [
    { path: '/api/agent?action=heartbeat', name: 'Agent' },
    { path: '/api/shop', name: 'Shop' },
    { path: '/api/messages', name: 'Messages' },
    { path: '/api/logs?action=routine', name: 'Logs' },
    { path: '/api/resource-tracker?action=health', name: 'Resources' }
  ];

  const results = await Promise.all(
    endpoints.map(async (ep) => {
      try {
        const start = Date.now();
        const res = await fetch(`${base}${ep.path}`);
        const latency = Date.now() - start;
        return { ...ep, ok: res.ok, status: res.status, latency };
      } catch (e) {
        return { ...ep, ok: false, status: 0, latency: 0, error: e.message };
      }
    })
  );

  return results;
}

async function runCheck() {
  console.log(`\n=== NLBL Monitor [${new Date().toISOString()}] ===`);
  
  // 1. Check endpoint health
  const endpoints = await checkEndpointHealth();
  const failedEndpoints = endpoints.filter(e => !e.ok);
  
  if (failedEndpoints.length > 0) {
    console.log('🚨 Endpoint failures detected:');
    failedEndpoints.forEach(e => {
      console.log(`  ❌ ${e.name}: ${e.status} (${e.latency}ms)`);
      if (e.error) console.log(`     Error: ${e.error}`);
    });

    if (!isSilentHour()) {
      await sendDiscordAlert('error', 'NLBL Endpoint Failures', 
        failedEndpoints.map(e => ({
          name: e.name,
          value: `${e.status} (${e.latency}ms)`,
          inline: true
        })),
        `One or more endpoints are failing. Immediate investigation required.`
      );
    }
  } else {
    console.log('✅ All endpoints healthy');
  }

  // 2. Check recent routine logs (hourly must have run in last 90 min)
  try {
    const res = await fetch(`https://${CONFIG.domain}/api/logs?action=routine&limit=10`);
    const data = await res.json();
    const logs = data.logs || [];
    const lastHourly = logs.find(l => l.routine_type === 'hourly');
    
    if (lastHourly) {
      const lastRun = new Date(lastHourly.created_at);
      const minutesAgo = (Date.now() - lastRun) / 60000;
      console.log(`⏰ Last hourly routine: ${minutesAgo.toFixed(1)} minutes ago`);
      
      if (minutesAgo > 90) {
        await sendDiscordAlert('warning', 'Hourly Routine Overdue', [
          { name: 'Last Run', value: `${minutesAgo.toFixed(0)} min ago`, inline: true },
          { name: 'Expected', value: 'Every 60 min', inline: true }
        ], `Hourly routine has not run in ${minutesAgo.toFixed(0)} minutes. Check scheduler.`);
      }
    }
  } catch (e) {
    console.error('Failed to check routine logs:', e.message);
  }

  // 3. Track error rate
  const recentErrors = await checkVercelLogs();
  errorHistory.push(...recentErrors.map(e => ({ time: Date.now(), error: e })));
  
  // Keep only last hour
  const hourAgo = Date.now() - 3600000;
  errorHistory = errorHistory.filter(e => e.time > hourAgo);
  
  if (errorHistory.length >= CONFIG.errorThreshold) {
    console.log(`🚨 Error threshold exceeded: ${errorHistory.length} errors in last hour`);
    if (!isSilentHour()) {
      await sendDiscordAlert('error', 'High Error Rate Detected', [
        { name: 'Errors (1hr)', value: String(errorHistory.length), inline: true },
        { name: 'Threshold', value: String(CONFIG.errorThreshold), inline: true }
      ], `More than ${CONFIG.errorThreshold} errors detected in the past hour. Review logs immediately.`);
    }
  }

  console.log('✓ Check complete\n');
}

// Start monitoring
console.log('🌌 NLBL Production Monitor started');
console.log(`   Domain: ${CONFIG.domain}`);
console.log(`   Interval: ${CONFIG.interval / 1000}s`);
console.log(`   Error Threshold: ${CONFIG.errorThreshold}`);

runCheck();
setInterval(runCheck, CONFIG.interval);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down monitor...');
  process.exit(0);
});
