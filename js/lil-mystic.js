// js/lil-mystic.js
const mysticInput = document.getElementById('mystic-input');
const mysticSend = document.getElementById('mystic-send');
const mysticLog = document.getElementById('mystic-chat-log');
const mysticStatus = document.getElementById('mystic-status');
const mysticOrb = document.getElementById('mystic-orb');

function appendMysticMessage(text, who = 'ai') {
  const div = document.createElement('div');
  div.className = `mystic-msg mystic-msg-${who}`;
  div.textContent = text;
  mysticLog.appendChild(div);
  mysticLog.scrollTop = mysticLog.scrollHeight;
}

async function sendToLilMystic(message, toolHint = null) {
  mysticStatus.textContent = 'Thinking across the cosmos…';
  mysticOrb.style.animationDuration = '1.4s';

  appendMysticMessage(message, 'user');

  try {
    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        toolHint,
        context: { source: 'workshop', ts: Date.now() }
      })
    });

    const data = await res.json();
    if (data.error) {
      appendMysticMessage(`⚠️ ${data.error}`, 'ai');
    } else {
      if (data.messages && Array.isArray(data.messages)) {
        data.messages.forEach(m => appendMysticMessage(m, 'ai'));
      } else if (data.reply) {
        appendMysticMessage(data.reply, 'ai');
      } else {
        appendMysticMessage('I acted, but the void returned no words.', 'ai');
      }

      // UI sync: refresh products panel after relevant tools
      if (data.actionsRun && Array.isArray(data.actionsRun)) {
        maybeRefreshUI(data.actionsRun);
      }
    }
  } catch (err) {
    appendMysticMessage(`⚠️ Connection failed: ${err.message}`, 'ai');
  } finally {
    mysticStatus.textContent = 'Idle · Awaiting your command';
    mysticOrb.style.animationDuration = '2.4s';
  }
}

function maybeRefreshUI(actionsRun) {
  if (!window.NLBL || typeof window.NLBL.loadWorkshopProducts !== 'function') return;
  const refreshTriggers = [
    'Sync Printify catalog',
    'Generate new cosmic products',
    'Clean gibberish products'
  ];
  if (actionsRun.some(a => refreshTriggers.some(t => a.includes(t)))) {
    window.NLBL.loadWorkshopProducts();
  }
}

mysticSend.addEventListener('click', () => {
  const value = mysticInput.value.trim();
  if (!value) return;
  mysticInput.value = '';
  sendToLilMystic(value);
});

mysticInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') mysticSend.click();
});

// Hook tools to Lil Mystic
document.querySelectorAll('.workshop-tool-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tool = btn.dataset.tool;
    const label = btn.textContent.trim();
    sendToLilMystic(`Run tool: ${label}`, tool);
  });
});
