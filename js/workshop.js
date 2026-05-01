// js/workshop.js
const workshopProductsEl = document.getElementById('workshop-products');
const healthDot = document.getElementById('health-dot');
const healthText = document.getElementById('health-text');
const auditPanel = document.getElementById('audit-panel');
const auditOutput = document.getElementById('audit-output');
const auditBtn = document.getElementById('audit-run-btn');

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
  window.NLBL = window.NLBL || {};
  window.NLBL.loadWorkshopProducts = loadWorkshopProducts;

  if (auditBtn) {
    auditBtn.addEventListener('click', () => {
      loadAudit();
    });
  }
});
