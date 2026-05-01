// js/workshop.js
const workshopProductsEl = document.getElementById('workshop-products');
const healthDot = document.getElementById('health-dot');
const healthText = document.getElementById('health-text');
const auditPanel = document.getElementById('audit-panel');
const auditOutput = document.getElementById('audit-output');
const auditBtn = document.getElementById('audit-run-btn');
const routinePanel = document.getElementById('routine-panel');
const routineLogs = document.getElementById('routine-logs');
const routineRunBtn = document.getElementById('routine-run-btn');
const performancePanel = document.getElementById('performance-panel');
const perfStats = document.getElementById('perf-stats');
const perfRefreshBtn = document.getElementById('perf-refresh-btn');
const routineMetricsEl = document.getElementById('routine-metrics');
const latencyMetricsEl = document.getElementById('latency-metrics');

function setHealth(status) {
  if (!healthDot || !healthText) return;
  const normalized = String(status).toLowerCase();
  healthDot.className = 'status-dot';
  if (normalized.includes('good') || normalized.includes('healthy') || normalized.includes('ok') || normalized.includes('green')) {
    healthDot.classList.add('green');
    healthText.textContent = 'System Healthy';
  } else if (normalized.includes('warn') || normalized.includes('partial') || normalized.includes('yellow')) {
    healthDot.classList.add('yellow');
    healthText.textContent = 'System Warning';
  } else {
    healthDot.classList.add('red');
    healthText.textContent = 'System Error';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function syntaxHighlight(json) {
  if (typeof json !== 'string') json = JSON.stringify(json, null, 2);
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) { cls = 'key'; }
      else { cls = 'string'; }
    } else if (/true|false/.test(match)) { cls = 'boolean'; }
    else if (/null/.test(match)) { cls = 'null'; }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

async function loadAudit() {
  try {
    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'audit site' })
    });
    const data = await res.json();
    const messages = data.messages || [];
    const auditMsg = messages.find(m => m.includes('Audit complete:') || m.includes('Audit:'));
    const statusMatch = auditMsg ? auditMsg.match(/Audit[:\s]+(\d+\/\d+)/) : null;
    
    if (statusMatch) {
      const [_, passedRatio] = statusMatch;
      const [passed, total] = passedRatio.split('/').map(Number);
      const ratio = passed / total;
      setHealth(ratio === 1 ? 'green' : ratio >= 0.6 ? 'yellow' : 'red');
    } else {
      setHealth('red');
    }

    if (auditPanel && auditOutput) {
      auditPanel.classList.add('visible');
      auditOutput.innerHTML = syntaxHighlight(messages.join('\n'));
    }
  } catch (err) {
    setHealth('red');
    if (auditPanel && auditOutput) {
      auditPanel.classList.add('visible');
      auditOutput.innerHTML = `Audit error: ${err.message}`;
    }
  }
}

async function loadRoutineLogs() {
  try {
    const res = await fetch('/api/routine-logs?limit=10');
    if (!res.ok) return;
    const data = await res.json();
    const logs = data.logs || [];
    if (!routineLogs) return;

    routineLogs.innerHTML = '';
    if (!logs.length) {
      routineLogs.textContent = 'No routine logs yet.';
      return;
    }

    logs.forEach(log => {
      const div = document.createElement('div');
      div.style.cssText = 'margin-bottom:0.75rem;padding:0.5rem;background:rgba(0,0,0,0.3);border-radius:8px;border-left:3px solid #ff9cfb;';
      div.innerHTML = `
        <div style="font-size:0.75rem;color:#a7b3ff;margin-bottom:0.25rem;">
          ${log.routine_type} — ${new Date(log.created_at).toLocaleString()}
        </div>
        <div style="font-size:0.8rem;color:#c9d0ff;white-space:pre-wrap;word-break:break-word;">
          ${escapeHtml(String(log.report_preview || '').slice(0, 300))}
        </div>
      `;
      routineLogs.appendChild(div);
    });
  } catch (err) {
    if (routineLogs) routineLogs.textContent = `Error loading logs: ${err.message}`;
  }
}

async function loadPerformanceMetrics() {
  try {
    const res = await fetch('/api/routine-logs?limit=50');
    if (!res.ok) throw new Error('Failed to fetch logs');
    const data = await res.json();
    const logs = data.logs || [];

    if (!perfStats) return;

    if (!logs.length) {
      perfStats.innerHTML = '<div style="color:#888;">No performance data yet. Routines will populate this.</div>';
      return;
    }

    // Separate by type
    const hourly = logs.filter(l => l.routine_type === 'hourly');
    const nightly = logs.filter(l => l.routine_type === 'nightly');

    // Calculate averages
    const avg = (arr, field) => {
      if (!arr.length) return 'N/A';
      const sum = arr.reduce((acc, l) => acc + (Number(l[field]) || 0), 0);
      return Math.round(sum / arr.length);
    };

    const avgHourlyDur = avg(hourly, 'duration_ms');
    const avgNightlyDur = avg(nightly, 'duration_ms');
    const totalAutoFixes = logs.reduce((acc, l) => acc + (Number(l.auto_fixes) || 0), 0);

    // Trend: compare last 5 vs previous 5 hourly runs
    const recentHourly = hourly.slice(0, 5);
    const prevHourly = hourly.slice(5, 10);
    const recentAvg = avg(recentHourly, 'duration_ms');
    const prevAvg = avg(prevHourly, 'duration_ms');
    let trendMsg = '';
    if (recentAvg !== 'N/A' && prevAvg !== 'N/A' && recentAvg > prevAvg * 1.2) {
      trendMsg = `<div style="color:#f1c40f;margin-top:0.5rem;">⚠️ Hourly routine slowing down: ${prevAvg}ms → ${recentAvg}ms</div>`;
    } else if (recentAvg !== 'N/A' && prevAvg !== 'N/A' && recentAvg < prevAvg * 0.8) {
      trendMsg = `<div style="color:#2ecc71;margin-top:0.5rem;">✅ Hourly routine improved: ${prevAvg}ms → ${recentAvg}ms</div>`;
    }

    perfStats.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;font-size:0.85rem;">
        <div>
          <span style="color:#888;">Avg Hourly</span><br>
          <span style="color:#ff9cfb;font-weight:700;font-size:1.2rem;">${avgHourlyDur === 'N/A' ? '—' : (avgHourlyDur / 1000).toFixed(1)}s</span>
        </div>
        <div>
          <span style="color:#888;">Avg Nightly</span><br>
          <span style="color:#7f5dff;font-weight:700;font-size:1.2rem;">${avgNightlyDur === 'N/A' ? '—' : (avgNightlyDur / 1000).toFixed(1)}s</span>
        </div>
        <div>
          <span style="color:#888;">Total Auto-Fixes</span><br>
          <span style="color:#e74c3c;font-weight:700;">${totalAutoFixes}</span>
        </div>
        <div>
          <span style="color:#888;">Runs Tracked</span><br>
          <span style="color:#a7d5ff;font-weight:700;">${logs.length}</span>
        </div>
      </div>
      <div style="margin-top:0.75rem;font-size:0.8rem;color:#c9d0ff;">
        <div style="margin-bottom:0.25rem;"><strong>Slowest Routines (avg):</strong></div>
        ${hourly.length ? `<div>Hourly: ${(avgHourlyDur / 1000).toFixed(1)}s</div>` : ''}
        ${nightly.length ? `<div>Nightly: ${(avgNightlyDur / 1000).toFixed(1)}s</div>` : ''}
      </div>
      ${trendMsg}
      <div style="margin-top:0.75rem;font-size:0.75rem;color:#666;">
        Auto-fix count since tracking began: ${totalAutoFixes}
      </div>
    `;
  } catch (err) {
    if (perfStats) perfStats.innerHTML = `Error: ${err.message}`;
  }
}

async function loadRoutineMetrics() {
  try {
    const res = await fetch('/api/routine-logs?limit=20');
    if (!res.ok) return;
    const data = await res.json();
    const logs = data.logs || [];
    if (!routineMetricsEl) return;

    routineMetricsEl.innerHTML = '';
    if (!logs.length) {
      routineMetricsEl.textContent = 'No routine data yet.';
      return;
    }

    logs.forEach(log => {
      const row = document.createElement('div');
      row.className = 'workshop-product-row';
      row.innerHTML = `
        <span>${log.routine_type} · ${new Date(log.created_at).toLocaleString()}</span>
        <span style="opacity:0.7;">${log.duration_ms}ms · slowest: ${log.slowest_step || '—'} · auto-fixes: ${log.auto_fixes || 0}</span>
      `;
      routineMetricsEl.appendChild(row);
    });
  } catch (err) {
    if (routineMetricsEl) routineMetricsEl.textContent = `Error: ${err.message}`;
  }
}

async function loadLatencyMetrics() {
  try {
    const res = await fetch('/api/last-audit');
    if (!res.ok) return;
    const data = await res.json();
    const endpoints = data.endpoints || {};
    if (!latencyMetricsEl) return;

    latencyMetricsEl.innerHTML = '';

    if (!Object.keys(endpoints).length) {
      latencyMetricsEl.textContent = 'No latency data available yet.';
      return;
    }

    Object.entries(endpoints).forEach(([name, info]) => {
      const row = document.createElement('div');
      row.className = 'workshop-product-row';
      const color = (info.latency || 0) > 500 ? '#ff6b6b' : (info.latency || 0) > 250 ? '#ffd166' : '#4ade80';
      row.innerHTML = `
        <span>${name}</span>
        <span style="color:${color};">${info.latency}ms · ${info.status}</span>
      `;
      latencyMetricsEl.appendChild(row);
    });
  } catch (err) {
    if (latencyMetricsEl) latencyMetricsEl.textContent = `Error: ${err.message}`;
  }
}

async function loadWorkshopProducts() {
  try {
    const res = await fetch('/api/printify?action=catalog');
    const data = await res.json();
    const products = data?.catalog || data?.products || [];

    workshopProductsEl.innerHTML = '';

    if (!products.length) {
      workshopProductsEl.textContent = 'No products loaded yet. Try "Sync Printify Catalog" with Lil Mystic.';
      return;
    }

    products.slice(0, 50).forEach(p => {
      const row = document.createElement('div');
      row.className = 'workshop-product-row';
      const title = p.title || p.name || 'Untitled';
      const id = p.id || p.product_id || '—';
      row.innerHTML = `<span>${title}</span><span style="opacity:0.6;">${id}</span>`;
      workshopProductsEl.appendChild(row);
    });
  } catch (err) {
    workshopProductsEl.textContent = `Error loading products: ${err.message}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadWorkshopProducts();
  loadAudit();
  loadRoutineLogs();
  loadPerformanceMetrics();
  loadRoutineMetrics();
  loadLatencyMetrics();
  window.NLBL = window.NLBL || {};
  window.NLBL.loadWorkshopProducts = loadWorkshopProducts;
  window.NLBL.loadRoutineMetrics = loadRoutineMetrics;
  window.NLBL.loadLatencyMetrics = loadLatencyMetrics;

  if (auditBtn) {
    auditBtn.addEventListener('click', () => {
      loadAudit();
    });
  }

  if (routineRunBtn) {
    routineRunBtn.addEventListener('click', async () => {
      routineRunBtn.textContent = 'Running…';
      routineRunBtn.disabled = true;
      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'run full system routine', toolHint: null })
        });
        const data = await res.json();
        if (data.messages && Array.isArray(data.messages)) {
          console.log('Routine result:', data.messages[data.messages.length - 1]);
        }
        setTimeout(() => {
          loadRoutineLogs();
          loadPerformanceMetrics();
          loadRoutineMetrics();
          loadLatencyMetrics();
        }, 2000);
      } catch (err) {
        console.error('Routine trigger failed:', err);
      } finally {
        routineRunBtn.textContent = 'Run Full Routine Now';
        routineRunBtn.disabled = false;
      }
    });
  }

  if (perfRefreshBtn) {
    perfRefreshBtn.addEventListener('click', () => {
      loadPerformanceMetrics();
      loadRoutineMetrics();
      loadLatencyMetrics();
    });
  }

  // Start Workshop Intelligence Layer heartbeat
  if (typeof startHeartbeat === 'function') {
    startHeartbeat(45000); // every 45 seconds
  }
});
