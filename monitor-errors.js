/**
 * 🚨 NLBL Error Monitoring Script
 * Polls critical endpoints and logs failures to the terminal.
 */
const DOMAIN = 'http://localhost:3001';
const ENDPOINTS = [
  '/api/agent?action=heartbeat',
  '/api/shop?action=list',
  '/api/messages?action=list'
];

async function check() {
  console.log(`\n[${new Date().toLocaleTimeString()}] 🔍 Checking systems...`);
  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(DOMAIN + ep);
      if (res.ok) {
        console.log(`✅ ${ep.padEnd(30)} - ${res.status}`);
      } else {
        console.error(`❌ ${ep.padEnd(30)} - HTTP ${res.status}`);
      }
    } catch (e) {
      console.error(`🚨 ${ep.padEnd(30)} - CONNECTION FAILED: ${e.message}`);
    }
  }
}

setInterval(check, 30000);
check();