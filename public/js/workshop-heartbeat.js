// js/workshop-heartbeat.js
// Workshop Intelligence Layer — background awareness
let heartbeatInterval = null;
let lastAlerts = [];

function setHealthDot(status) {
  const dot = document.getElementById('health-dot');
  const text = document.getElementById('health-text');
  if (!dot || !text) return;

  dot.className = 'status-dot'; // reset

  switch (status) {
    case 'healthy':
      dot.classList.add('green');
      text.textContent = 'System Healthy';
      break;
    case 'noticing':
      dot.classList.add('yellow');
      text.textContent = 'Noticing…';
      break;
    case 'degraded':
      dot.classList.add('yellow');
      text.textContent = 'Degraded';
      break;
    case 'critical':
      dot.classList.add('red');
      text.textContent = 'Critical';
      break;
    default:
      dot.classList.add('yellow');
      text.textContent = status;
  }
}

function highlightWorkshopAlert() {
  const panel = document.getElementById('workshop-dashboard');
  if (!panel) return;
  panel.style.boxShadow = '0 0 25px rgba(255, 80, 80, 0.7)';
  setTimeout(() => {
    panel.style.boxShadow = '';
  }, 3000);
}

async function runHeartbeat() {
  try {
    const res = await fetch('/api/agent?action=heartbeat');
    if (!res.ok) return;

    const data = await res.json();
    const currentAlerts = data.alerts || [];

    // Detect new alerts
    const newAlerts = currentAlerts.filter(a =>
      !lastAlerts.some(la => la.message === a.message)
    );

    if (newAlerts.length > 0) {
      // Notify via chat
      if (window.NLBL && window.NLBL.lilMysticNotify) {
        newAlerts.forEach(a => {
          window.NLBL.lilMysticNotify(`🌐 ${a.message}`);
        });
      }

      // Highlight panel
      highlightWorkshopAlert();

      // Auto-refresh audit to show latest state
      if (window.NLBL && typeof window.NLBL.loadLogs === 'function') {
        window.NLBL.loadLogs();
      }
    }

    lastAlerts = currentAlerts;
    setHealthDot(data.health || (data.status === 'ok' ? 'healthy' : 'unknown'));
  } catch (err) {
    console.warn('Heartbeat cycle failed:', err);
  }
}

function startHeartbeat(intervalMs = 45000) {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  runHeartbeat(); // immediate first run
  heartbeatInterval = setInterval(runHeartbeat, intervalMs);
}

function stopHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = null;
}

// Expose globally for UI hooks
window.NLBL = window.NLBL || {};
window.NLBL.startHeartbeat = startHeartbeat;
window.NLBL.stopHeartbeat = stopHeartbeat;
window.NLBL.highlightWorkshopAlert = highlightWorkshopAlert;
window.NLBL.lilMysticNotify = function(msg) {
  // Will be overwritten by lil-mystic.js; here as fallback
  console.log('[Lil Mystic]', msg);
};
