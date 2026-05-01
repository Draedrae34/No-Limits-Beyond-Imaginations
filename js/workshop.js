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
  window.NLBL = window.NLBL || {};
  window.NLBL.loadWorkshopProducts = loadWorkshopProducts;

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
          // Show last message in chat (already handled by lil-mystic)
          console.log('Routine result:', data.messages[data.messages.length - 1]);
        }
        // Refresh logs after delay
        setTimeout(loadRoutineLogs, 2000);
      } catch (err) {
        console.error('Routine trigger failed:', err);
      } finally {
        routineRunBtn.textContent = 'Run Full Routine Now';
        routineRunBtn.disabled = false;
      }
    });
  }

  // Start Workshop Intelligence Layer heartbeat
  if (typeof startHeartbeat === 'function') {
    startHeartbeat(45000); // every 45 seconds
  }
});
