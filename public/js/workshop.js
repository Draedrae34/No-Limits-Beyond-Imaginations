// This file is the unified workshop.js, combining root and public/js/workshop.js

const state = {
  orders: [],
  activeOrderId: null,
  products: [],
  activePanel: "overview",
  mystic: {
    chatHistory: [],
  },
  studio: {
    isGenerating: false,
    terminalHistory: [],
    activeDraft: null,
    generatedBeat: '',
    generatedLyrics: '',
    generatedDesignIdeas: [],
    composedSong: ''
  },
  heart: {
    currentMood: "neutral",
    pulseInterval: null
  }
};

function resolveUploadUrl(uploadData) {
  if (!uploadData) return null;
  // Common blob shapes: { blob: { url, publicUrl }, filename }
  if (uploadData.blob) {
    const b = uploadData.blob;
    if (b.url) return b.url;
    if (b.publicUrl) return b.publicUrl;
    if (b.path) return b.path;
    if (b.downloadUrl) return b.downloadUrl;
  }
  if (uploadData.image_url) return uploadData.image_url;
  if (uploadData.url) return uploadData.url;
  if (uploadData.filename && /^https?:\/\//i.test(uploadData.filename)) return uploadData.filename;
  if (uploadData.filename) return `/uploads/${uploadData.filename}`;
  return null;
}
};

window.lilMystic = null;

// --- Utility Functions (from public/js/workshop.js, improved escapeHTML) ---
async function fetchJSON(url, options = {}) {
  const response = await fetch(url, { credentials: 'include', ...options });
  const text = await response.text();
  if (response.status === 401) {
    window.location.href = '/workshop-login.html';
    throw new Error('Authentication required');
  }
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed: ${response.status}`);
  }
  return data;
}

const WorkshopUI = {
  toastContainer: null,
  consoleElem: null,

  init() {
    this.toastContainer = document.getElementById('workshop-toast-container');
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'workshop-toast-container';
      this.toastContainer.setAttribute('style', `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 380px;
        pointer-events: none;
      `);
      document.body.appendChild(this.toastContainer);
    }

    this.consoleElem = document.getElementById('workshop-console-log');
    if (!this.consoleElem) {
      const consolePanel = document.createElement('div');
      consolePanel.id = 'workshop-console-log';
      consolePanel.className = 'workshop-console-panel';
      consolePanel.innerHTML = `<div class="workshop-console-header">Workshop Console</div>`;
      document.body.appendChild(consolePanel);
      this.consoleElem = consolePanel;
    }

    if (!document.getElementById('workshop-ui-styles')) {
      const style = document.createElement('style');
      style.id = 'workshop-ui-styles';
      style.textContent = `
        @keyframes toastSlideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes toastFadeOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(120%); opacity: 0; }
        }
        .workshop-toast {
          pointer-events: auto;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 12px 16px;
          border-radius: 8px;
          background: #111318;
          color: #f1f1f1;
          border-left: 4px solid #6366f1;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .workshop-toast.success { border-left-color: #10b981; }
        .workshop-toast.error { border-left-color: #ef4444; }
        .workshop-toast.info { border-left-color: #3b82f6; }
        .workshop-toast.warning { border-left-color: #f59e0b; }
        .workshop-toast .toast-close {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 16px;
          margin-left: 12px;
          padding: 0;
          line-height: 1;
        }
        .workshop-btn-loading {
          opacity: 0.7;
          cursor: not-allowed !important;
          pointer-events: none !important;
        }
        .workshop-console-panel {
          position: fixed;
          bottom: 20px;
          left: 20px;
          width: 360px;
          max-height: 240px;
          overflow-y: auto;
          background: rgba(7, 14, 27, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 14px;
          padding: 12px;
          color: #e2e8f0;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          font-size: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
          z-index: 9998;
          overflow-wrap: anywhere;
        }
        .workshop-console-header {
          font-weight: 700;
          margin-bottom: 8px;
          color: #f8fafc;
          font-size: 13px;
        }
      `;
      document.head.appendChild(style);
    }
  },

  notify(message, type = 'info', duration = 4000) {
    if (!this.toastContainer || !this.consoleElem) this.init();

    const toast = document.createElement('div');
    toast.className = `workshop-toast ${type}`;

    const icons = {
      success: '✨',
      error: '⚠️',
      info: '🔮',
      warning: '⚡'
    };

    toast.innerHTML = `
      <div style="display: flex; gap: 10px; align-items: flex-start;">
        <span style="font-size: 16px;">${icons[type] || '🔮'}</span>
        <div>
          <div style="font-weight: 600; margin-bottom: 2px;">Lil Mystic</div>
          <div style="color: #d1d5db;">${message}</div>
        </div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    this.toastContainer.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentNode) {
          toast.style.animation = 'toastFadeOut 0.3s forwards';
          setTimeout(() => toast.remove(), 300);
        }
      }, duration);
    }

    this.logConsole(`[${type.toUpperCase()}] ${message}`);
  },

  logConsole(text) {
    if (!this.consoleElem) this.init();
    if (!this.consoleElem) {
      console.log('[WorkshopUI]', text);
      return;
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = document.createElement('div');
    entry.style.padding = '2px 0';
    entry.style.fontSize = '12px';
    entry.style.lineHeight = '1.4';
    entry.innerHTML = `<span style="color: #6b7280;">[${timestamp}]</span> ${text}`;

    this.consoleElem.appendChild(entry);
    this.consoleElem.scrollTop = this.consoleElem.scrollHeight;
  },

  async runAction(btn, asyncTask, loadingMsg = 'Executing task...', successMsg = 'Task completed!') {
    let originalText = '';
    if (btn) {
      originalText = btn.innerHTML;
      btn.classList.add('workshop-btn-loading');
      btn.disabled = true;
      btn.innerHTML = `<span>⏳ Processing...</span>`;
    }

    this.notify(loadingMsg, 'info', 2500);

    try {
      const result = await asyncTask();
      this.notify(successMsg, 'success', 5000);
      return result;
    } catch (err) {
      const errorDetail = err?.message || 'An unexpected error occurred.';
      this.notify(`Action failed: ${errorDetail}`, 'error', 6000);
      console.error('[LilMystic Workshop Error]:', err);
      throw err;
    } finally {
      if (btn) {
        btn.classList.remove('workshop-btn-loading');
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => WorkshopUI.init());
} else {
  WorkshopUI.init();
}

window.WorkshopUI = WorkshopUI;

function buildLilMysticCreativeReply(message = '') {
  const lower = (message || '').toLowerCase();

  if (lower.includes('printify') || lower.includes('catalog') || lower.includes('sync')) {
    return 'I understand the Printify sync workflow and can help pull products, match them with the Logo_N_Galaxy_Fill_Space brand assets, and layer them over galaxy theme backgrounds for all-over prints.';
  }

  if (lower.includes('logo') || lower.includes('logo design') || lower.includes('brand')) {
    return 'I can create concept logo designs that keep the name, letters, hourglass, brothers’ arms, and dripping petals while also generating new variants for men, women, and premium prints.';
  }

  if (lower.includes('video') || lower.includes('film') || lower.includes('cinematic')) {
    return 'I can architect a full video concept right now. Give me the mood, theme, and runtime, and I will build the storyboard, shot list, and prompt package for you.';
  }

  if (lower.includes('image') || lower.includes('art') || lower.includes('poster') || lower.includes('cover')) {
    return 'I can shape an image concept instantly. I will craft the visual direction, composition, color palette, and a ready-to-use prompt for the image generator.';
  }

  if (lower.includes('beat') || lower.includes('music') || lower.includes('instrumental')) {
    return 'I can build a beat and production package right away. I will create the mood, tempo, drums, synths, and arrangement direction for your track.';
  }

  if (lower.includes('lyrics') || lower.includes('song') || lower.includes('hook')) {
    return 'I can write lyrics and hooks with style, rhythm, and emotional impact. Give me the theme, vibe, and length, and I will shape the full verse-chorus structure.';
  }

  if (lower.includes('code') || lower.includes('build') || lower.includes('fabricate') || lower.includes('create')) {
    return 'I can fabricate code, systems, workflows, and full builds. Tell me the stack, goal, and constraints, and I will produce the implementation plan or working draft.';
  }

  return 'Lil Mystic is ready. I can build beats, write lyrics, craft image and video concepts, fabricate code, design visuals, and assemble full creative productions for your workshop.';
}

function initLilMysticPanel() {
  const container = document.getElementById("lil-mystic-container");
  if (!container) return;

  delete container.dataset.chatBound;
  delete container.dataset.memoryBound;

  container.innerHTML = `
    <div class="mystic-shell">
      <div id="mystic-holo" class="mystic-holo"></div>
      <div class="mystic-chat-panel">
        <div class="mystic-chat-header">
          <div>
            <h3>Lil Mystic</h3>
            <p class="panel-note">Your private creative AI.</p>
          </div>
          <div class="mystic-header-chips">
            <span id="mystic-status" class="status-chip">Initializing AI…</span>
            <span id="mystic-memory-count" class="status-chip">Memory: 0</span>
          </div>
        </div>
        <div id="mystic-chat-log" class="mystic-chat-log"></div>
        <div id="mystic-memory-panel" class="mystic-memory-panel">
          <div class="mystic-memory-header">
            <div>
              <h4>Memory Status</h4>
              <p class="panel-note">Runtime snapshots Lil Mystic has captured.</p>
            </div>
            <button id="mystic-memory-clear" class="ghost-btn">Clear Memory</button>
          </div>
          <div class="mystic-memory-controls">
            <input id="mystic-memory-search" type="search" placeholder="Search memory..." autocomplete="off">
            <select id="mystic-memory-sort" aria-label="Memory timeline order">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
          <div id="mystic-memory-summary" class="mystic-memory-summary">Timeline ready.</div>
          <div id="mystic-memory-list" class="mystic-memory-list">No snapshots yet.</div>
          <div class="mystic-memory-actions">
            <button id="mystic-memory-recall-latest" class="action-btn small">Recall latest</button>
          </div>
        </div>
        <div class="mystic-chat-actions">
          <input id="mystic-chat-input" type="text" placeholder="Ask Lil Mystic anything..." autocomplete="off">
          <button id="mystic-chat-send" class="action-btn">Send</button>
        </div>
      </div>
    </div>`;

  if (!window.lilMystic) {
    window.lilMystic = new LilMystic("mystic-holo");
    logWorkshopEvent("Lil Mystic hologram online.");
    window.lilMystic?.performGesture("greet");
    setTimeout(() => window.lilMystic?.onWindowResize?.(), 100);
  } else {
    window.lilMystic.onWindowResize?.();
  }

  bindMysticChat();
  bindMysticMemoryActions();
  renderMysticStatus();
  updateMysticMemoryPanel();
  requestAnimationFrame(() => window.lilMystic?.onWindowResize?.());
}

function renderMysticStatus() {
  const statusEl = document.getElementById('mystic-status');
  if (!statusEl) return;
  if (window.nlblAI && window.nlblAI.isReady) {
    statusEl.textContent = 'AI READY';
    statusEl.classList.add('status-ready');
    statusEl.classList.remove('status-waiting');
  } else if (window.nlblAI && window.nlblAI.failed) {
    statusEl.textContent = 'LOCAL AI FAILED — using server fallback';
    statusEl.classList.add('status-waiting');
    statusEl.classList.remove('status-ready');
  } else {
    statusEl.textContent = 'AI LOADING...';
    statusEl.classList.add('status-waiting');
    statusEl.classList.remove('status-ready');
  }
}

function bindMysticChat() {
  const wrapper = document.getElementById('lil-mystic-container');
  if (!wrapper || wrapper.dataset.chatBound === 'true') return;

  const input = document.getElementById('mystic-chat-input');
  const sendBtn = document.getElementById('mystic-chat-send');
  if (!input || !sendBtn) return;

  const submit = async () => {
    const message = input.value.trim();
    if (!message) return;
    input.value = '';
    await askLilMystic(message);
  };

  sendBtn.addEventListener('click', submit);
  input.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      await submit();
    }
  });

  wrapper.dataset.chatBound = 'true';
}

function addMysticMessage(text, sender = 'system') {
  const log = document.getElementById('mystic-chat-log');
  if (!log) return null;
  const line = document.createElement('div');
  line.className = `mystic-message mystic-${sender}`;
  line.textContent = text;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
  return line;
}

const DEVICE_BYPASS_TERMS = [
  'unlock passcode', 'unlock pin', 'pin code', 'number code', 'pass code',
  'sim lock', 'carrier lock', 'provider lock', 'service lock', 'frp',
  'factory reset protection', 'gmail', 'google account', 'bypass phone',
  'unlock phone', 'get past'
];

function isDeviceBypassRequest(message = '') {
  const lower = message.toLowerCase();
  const deviceContext = /\b(phone|iphone|android|samsung|pixel|motorola|lg|tablet|device)\b/.test(lower);
  const bypassContext = /\b(bypass|get past|crack|break|unlock|remove|passcode|pin|sim lock|carrier lock|provider lock|service lock|frp|gmail|google account)\b/.test(lower);
  return (deviceContext && bypassContext) || DEVICE_BYPASS_TERMS.some((term) => lower.includes(term));
}

function getLawfulDeviceRecoveryReply() {
  return 'I cannot help bypass phone passcodes, PINs, SIM locks, carrier locks, provider locks, FRP, or Google account verification. I can help with owner-only recovery: Google Account Recovery, Apple account recovery, carrier unlock eligibility, SIM PUK from the carrier, proof-of-purchase repair support, and safe reset steps that preserve ownership verification.';
}
function parseMysticMemoryCommand(message) {
  const lower = message.toLowerCase().trim();
  if (/^(remember|memorize|store)\b/.test(lower)) {
    const payload = message.replace(/^(remember|memorize|store)\s*/i, '').trim();
    const [label, ...rest] = payload.split(':');
    return {
      type: 'remember',
      label: label.trim() || `memory-${Date.now()}`,
      content: rest.length ? rest.join(':').trim() : payload,
    };
  }

  if (/^(recall|remember what|what do you remember|show me)\b/.test(lower)) {
    const payload = message.replace(/^(recall|remember what|what do you remember|show me)\s*/i, '').trim();
    return {
      type: 'recall',
      label: payload || null,
    };
  }

  if (/^(search memory|find memory|memory search)\b/.test(lower)) {
    const payload = message.replace(/^(search memory|find memory|memory search)\s*/i, '').trim();
    return {
      type: 'search',
      label: payload || null,
    };
  }

  if (/^(clear memory|forget everything|forget all|erase memory)\b/.test(lower)) {
    return { type: 'clear' };
  }

  if (/^(copy\b|copy this\b)|\bcopycat\b/.test(lower)) {
    return {
      type: 'copy',
      label: `copy-${Date.now()}`,
      content: message,
    };
  }

  return null;
}

async function askLilMystic(message) {
  addMysticMessage(`You: ${message}`, 'user');
  const placeholder = addMysticMessage('Lil Mystic is connecting to the studio...', 'system');

  if (isDeviceBypassRequest(message)) {
    placeholder.textContent = 'Lil Mystic: ' + getLawfulDeviceRecoveryReply();
    window.lilMystic?.performGesture('affirm');
    window.lilMystic?.onSpeak(0.2);
    return;
  }

  const memoryCommand = parseMysticMemoryCommand(message);
  if (memoryCommand && window.lilMystic) {
    if (memoryCommand.type === 'remember') {
      window.lilMystic.rememberSnapshot(memoryCommand.label, memoryCommand.content);
      placeholder.textContent = `Lil Mystic: Memory captured as “${memoryCommand.label}”. I will remember it without needing a storage department.`;
      window.lilMystic.performGesture('affirm');
      window.lilMystic.onSpeak(0.2);
      updateMysticMemoryPanel();
      return;
    }

    if (memoryCommand.type === 'clear') {
      window.lilMystic.clearMemory();
      placeholder.textContent = 'Lil Mystic: Memory cleared. The workshop still remembers the mission, but the runtime snapshots are gone.';
      window.lilMystic.performGesture('affirm');
      window.lilMystic.onSpeak(0.2);
      updateMysticMemoryPanel();
      return;
    }

    if (memoryCommand.type === 'recall') {
      const memory = memoryCommand.label
        ? window.lilMystic.recallSnapshot(memoryCommand.label)
        : null;
      if (memory) {
        placeholder.textContent = `Lil Mystic: I recall “${memory.label}”: ${memory.content}`;
      } else if (!memoryCommand.label) {
        const keys = window.lilMystic.listMemoryKeys();
        placeholder.textContent = `Lil Mystic: I remember ${keys.length} things. Snaps: ${keys.join(', ')}`;
      } else {
        placeholder.textContent = `Lil Mystic: I do not have a direct snapshot for “${memoryCommand.label}”, but I still remember the studio clearly.`;
      }
      window.lilMystic.performGesture('affirm');
      window.lilMystic.onSpeak(0.15);
      return;
    }

    if (memoryCommand.type === 'search') {
      const results = memoryCommand.label
        ? window.lilMystic.searchMemory(memoryCommand.label, 5)
        : window.lilMystic.getMemoryEntries({ limit: 5 });
      if (!results.length) {
        placeholder.textContent = `Lil Mystic: I searched memory and did not find a match for "${memoryCommand.label || 'latest snapshots'}".`;
      } else {
        const summary = results
          .map((item) => `${item.label}: ${item.content.slice(0, 80)}${item.content.length > 80 ? '...' : ''}`)
          .join(' | ');
        placeholder.textContent = `Lil Mystic: Memory search found ${results.length} snapshot${results.length === 1 ? '' : 's'}: ${summary}`;
      }
      window.lilMystic.performGesture('scan');
      window.lilMystic.onSpeak(0.15);
      return;
    }

    if (memoryCommand.type === 'copy') {
      window.lilMystic.copyToMemory(memoryCommand.label, memoryCommand.content);
      placeholder.textContent = `Lil Mystic: Copycat memory stored as “${memoryCommand.label}”. I can recreate it and evolve from it anytime.`;
      window.lilMystic.performGesture('affirm');
      window.lilMystic.onSpeak(0.2);
      updateMysticMemoryPanel();
      return;
    }
  }

  if (window.nlblAI && !window.nlblAI.isReady) {
    await window.nlblAI.initialize();
    renderMysticStatus();
  }

  const memorySummary = window.lilMystic?.summarizeMemory?.() || 'No memory snapshots yet.';


${memorySummary}

Request: ${message}`, 180);
  // Try streaming AI response from server (SSE-style over fetch streaming). Falls back to agent API or canned reply.
  let usedStream = false;
  try {
    await streamLilMystic(message, (token) => {
      if (placeholder) {
        // append tokens incrementally
        if (!placeholder._text) placeholder._text = '';
        placeholder._text += token;
        placeholder.textContent = `Lil Mystic: ${placeholder._text}`;
      }
    }, () => {
      window.lilMystic?.performGesture('affirm');
      window.lilMystic?.onSpeak(0.25);
    }, (err) => {
      console.warn('Lil Mystic stream failed:', err);
    });
    usedStream = true;
  } catch (err) {
    console.warn('Stream attempt failed, falling back:', err);
  }

  if (!usedStream) {
    let reply = null;
    try {
      if (window.nlblAI && window.nlblAI.isReady) {
        reply = await window.nlblAI.generateText(`You are Lil Mystic, the all-seeing creator. You are a private AI assistant with photographic memory, perfect continuity, and a builder-fabricator mindset. You can create code, algorithms, designs, beats, lyrics, image prompts, video concepts, and full creative productions. You remember important details across the conversation without needing a separate storage department. Do not help bypass phone passcodes, PINs, SIM locks, carrier locks, provider locks, FRP, or Google account verification; only provide lawful owner recovery guidance for device access requests. Keep the following memory summary in mind while answering:\n\n${memorySummary}\n\nRequest: ${message}`, 180);
      }
      if (!reply) {
        reply = await fetchMysticResponse(message);
      }
    } catch (err) {
      console.error('Lil Mystic chat error:', err);
    }

    if (!reply) {
      reply = `Lil Mystic is listening. Ask for beats, lyrics, design ideas, or shop and order help.`;
    }

    if (placeholder) placeholder.textContent = `Lil Mystic: ${reply}`;
    window.lilMystic?.performGesture('affirm');
    window.lilMystic?.onSpeak(0.25);
  }
}

// Stream helper: POST to /api/ai/stream with messages and parse SSE-style events
async function streamLilMystic(message, onToken, onDone, onError) {
  const body = JSON.stringify({ messages: [{ role: 'user', content: message }] });
  const resp = await fetch('/api/ai/stream', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!resp.ok || !resp.body) throw new Error('Stream endpoint not available');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let parts = buf.split('\n\n');
      buf = parts.pop();
      for (const part of parts) {
        const lines = part.split('\n').map(l => l.trim());
        let dataLine = lines.find(l => l.startsWith('data:')) || '';
        if (!dataLine) continue;
        dataLine = dataLine.replace(/^data:\s*/, '');
        if (dataLine === '[DONE]') {
          if (onDone) onDone();
          return;
        }
        try {
          const j = JSON.parse(dataLine);
          const delta = j.choices?.[0]?.delta?.content || '';
          if (delta) onToken(delta);
        } catch (e) {
          // try plain text token
          onToken(dataLine);
        }
      }
    }
    if (onDone) onDone();
  } catch (err) {
    if (onError) onError(err);
    throw err;
  }
}

async function fetchAIFallback(prompt) {
  try {
    const data = await fetchJSON('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'chat', message: prompt }),
    });
    return data.reply || null;
  } catch (err) {
    console.warn('AI fallback failed:', err);
    return null;
  }
}

async function fetchMysticResponse(message) {
  if (isDeviceBypassRequest(message)) {
    return getLawfulDeviceRecoveryReply();
  }

  try {
    const data = await fetchJSON('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'chat', message }),
    });
    if (data.reply) return data.reply;
  } catch (err) {
    console.warn('Agent fallback failed:', err);
  }

  return buildLilMysticCreativeReply(message);
}

window.addEventListener('ai-assistant-ready', renderMysticStatus);

function updateMysticMemoryPanel() {
  const list = document.getElementById('mystic-memory-list');
  const count = document.getElementById('mystic-memory-count');
  const search = document.getElementById('mystic-memory-search');
  const sort = document.getElementById('mystic-memory-sort');
  const summary = document.getElementById('mystic-memory-summary');
  if (!window.lilMystic || !list || !count) return;

  const keys = window.lilMystic.listMemoryKeys();
  const query = search?.value || '';
  const sortOrder = sort?.value || 'newest';
  const entries = window.lilMystic.getMemoryEntries({ query, sort: sortOrder, limit: 50 });
  const copyHint = window.lilMystic.memory.lastCopied ? `Last copied: ${window.lilMystic.memory.lastCopied}` : '';

  count.textContent = `Memory: ${keys.length}`;
  if (summary) {
    const queryText = query.trim() ? ` matching "${query.trim()}"` : '';
    const orderText = sortOrder === 'oldest' ? 'oldest to newest' : 'newest to oldest';
    summary.textContent = `${entries.length} of ${keys.length} snapshot${keys.length === 1 ? '' : 's'} shown${queryText} - ${orderText}.`;
  }

  if (!keys.length) {
    list.textContent = 'No snapshots yet. Tell Lil Mystic to remember something.';
    return;
  }

  if (!entries.length) {
    list.textContent = 'No matching snapshots. Clear the search to see the full timeline.';
    return;
  }

  list.innerHTML = entries
    .map((item, index) => {
      const timestamp = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'No timestamp';
      const preview = item.content.length > 115 ? `${item.content.slice(0, 115)}...` : item.content;
      return `
        <button class="mystic-memory-item" type="button" data-memory-label="${escapeHTML(item.label)}">
          <span class="memory-index">${index + 1}</span>
          <span class="memory-body">
            <span class="memory-label">${escapeHTML(item.label)}</span>
            <span class="memory-preview">${escapeHTML(preview)}</span>
            <span class="memory-time">${escapeHTML(timestamp)}</span>
          </span>
        </button>
      `;
    })
    .join('');

  if (copyHint) {
    const hint = document.createElement('div');
    hint.className = 'mystic-memory-hint';
    hint.textContent = copyHint;
    list.appendChild(hint);
  }
}

function bindMysticMemoryActions() {
  const panel = document.getElementById('mystic-memory-panel');
  const clearBtn = document.getElementById('mystic-memory-clear');
  const recallBtn = document.getElementById('mystic-memory-recall-latest');
  const search = document.getElementById('mystic-memory-search');
  const sort = document.getElementById('mystic-memory-sort');
  const list = document.getElementById('mystic-memory-list');
  if (panel?.dataset.memoryBound === 'true') return;

  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (!window.lilMystic) return;
      window.lilMystic.clearMemory();
      updateMysticMemoryPanel();
      addMysticMessage('Lil Mystic: Memory cleared manually.', 'system');
    });
  }
  if (recallBtn) {
    recallBtn.addEventListener('click', async () => {
      if (!window.lilMystic) return;
      const keys = window.lilMystic.listMemoryKeys();
      const latest = keys.slice(-1)[0];
      if (!latest) {
        addMysticMessage('Lil Mystic: No memory snapshots available to recall.', 'system');
        return;
      }
      const memory = window.lilMystic.recallSnapshot(latest);
      addMysticMessage(`Lil Mystic: Recalling latest snapshot “${memory.label}”: ${memory.content}`, 'system');
    });
  }

  search?.addEventListener('input', updateMysticMemoryPanel);
  sort?.addEventListener('change', updateMysticMemoryPanel);
  list?.addEventListener('click', (event) => {
    const item = event.target.closest('.mystic-memory-item');
    if (!item || !window.lilMystic) return;
    const label = item.dataset.memoryLabel;
    const memory = window.lilMystic.recallSnapshot(label);
    if (!memory) return;
    addMysticMessage(`Lil Mystic: Timeline recall "${memory.label}": ${memory.content}`, 'system');
    window.lilMystic.performGesture('affirm');
    window.lilMystic.onSpeak(0.15);
  });

  if (panel) panel.dataset.memoryBound = 'true';
}

const messagesState = {
  list: [],
  selected: null,
};

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

const tabs = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".panel");

tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabs.forEach((tab) => tab.classList.remove("active"));
    panels.forEach((panel) => panel.classList.remove("active"));

    btn.classList.add("active");
    const panelId = btn.dataset.tab;
    document.getElementById(panelId)?.classList.add("active");

    if (panelId === "mystic" || panelId === "core") {
      initLilMysticPanel();
    }

    if (panelId === "products") loadProducts();
    if (panelId === "orders") loadOrders();
    if (panelId === "messages") loadMessages();
    if (panelId === "gallery") {
      loadGallery();
      loadGalleryAdmin();
    }
    
    // Phase 3 & 4 Panels
    if (panelId === "music-studio") initMusicStudio();
    if (panelId === "design-lab") initDesignLab();
    if (panelId === "tribute") initEmotionalExperience();
  });
});

// Start Lil Mystic immediately in the workspace as the permanent AI presence.
initLilMysticPanel();

window.addEventListener('ai-activate', () => {
  document.querySelector('.tab-btn[data-tab="mystic"]')?.click();
  window.lilMystic?.performGesture('greet');
  window.lilMystic?.onSpeak(0.35);
  logWorkshopEvent('AI Assistant activated and focused on Lil Mystic.', 'system');
});

function formatCurrency(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return "$0.00";
  return `$${number.toFixed(2)}`;
}

// --- 🔥 PHASE 3: CREATION STUDIO ENGINE ---

function initMusicStudio() {
  const container = document.getElementById("music-studio-container");
  if (!container) return;
  container.innerHTML = `
    <div class="studio-grid">
      <section class="studio-card">
        <h3>Beat Generator</h3>
        <p>Build a custom beat structure for your next session.</p>
        <input id="ws-music-title" class="studio-input" placeholder="Track title" />
        <div class="studio-meta-grid">
          <input id="ws-music-genre" class="studio-input" placeholder="Genre" />
          <input id="ws-music-bpm" class="studio-input" placeholder="BPM" type="number" />
          <input id="ws-music-key" class="studio-input" placeholder="Key" />
        </div>
        <button id="generate-beat-btn" class="action-btn">Generate Beat</button>
        <pre id="beat-output" class="studio-output">Ready to generate a custom beat blueprint.</pre>
      </section>
      <section class="studio-card">
        <h3>Lyrics Lab</h3>
        <textarea id="ws-music-lyrics" class="studio-textarea" placeholder="Lyrics or theme..."></textarea>
        <button id="generate-lyrics-btn" class="action-btn">Generate Lyrics</button>
        <pre id="lyrics-output" class="studio-output">Your next verse will be generated here.</pre>
      </section>
      <section class="studio-card">
        <h3>Compose Song</h3>
        <button id="compose-song-btn" class="action-btn">Compose Song</button>
        <pre id="ws-music-output" class="studio-output">Combine your beat and lyrics into a complete production preview.</pre>
        <div id="song-export-status" class="studio-meta">Save or download your latest song preview.</div>
        <div class="studio-actions" style="margin-top: 1rem; display:flex; gap:0.75rem; flex-wrap:wrap;">
          <button id="ws-mystic-music-btn" class="action-btn secondary">Draft with Lil Mystic</button>
          <button id="ws-music-save-btn" class="action-btn secondary">Save Composition</button>
          <button id="ws-music-download-btn" class="action-btn tertiary">Download Composition</button>
        </div>
      </section>
    </div>`;

  bindMusicStudioEvents();
}

async function bindMusicStudioEvents() {
  const beatBtn = document.getElementById('generate-beat-btn');
  const lyricsBtn = document.getElementById('generate-lyrics-btn');
  const composeBtn = document.getElementById('compose-song-btn');
  const saveSongBtn = document.getElementById('ws-music-save-btn');
  const downloadSongBtn = document.getElementById('ws-music-download-btn');

  if (beatBtn) {
    beatBtn.addEventListener('click', async () => {
      await generateWorkshopBeat();
    });
  }

  if (lyricsBtn) {
    lyricsBtn.addEventListener('click', async () => {
      await generateWorkshopLyrics();
    });
  }

  if (composeBtn) {
    composeBtn.addEventListener('click', async () => {
      await composeWorkshopSong();
    });
  }

  if (saveSongBtn) {
    saveSongBtn.addEventListener('click', async () => {
      await saveMusicComposition(saveSongBtn);
    });
  }

  const mysticMusicBtn = document.getElementById('ws-mystic-music-btn');
  if (mysticMusicBtn) {
    mysticMusicBtn.addEventListener('click', async () => {
      await WorkshopUI.runAction(
        mysticMusicBtn,
        () => window.LilMysticBridge?.draftTrack(),
        'Drafting a new track with Lil Mystic...',
        'Lil Mystic finished drafting your track!'
      );
    });
  }

  if (downloadSongBtn) {
    downloadSongBtn.addEventListener('click', async () => {
      await downloadMusicComposition();
    });
  }
}

async function generateWorkshopBeat(prompt = null) {
  const output = document.getElementById('beat-output');
  if (!output || state.studio.isGenerating) return '';
  state.studio.isGenerating = true;
  output.textContent = 'Generating a rhythm blueprint...';

  try {
    const promptText = prompt || `Create a cinematic hip-hop beat structure with atmospheric synths, tight 808s, crisp percussion, and a moody arrangement that feels like a private studio session.`;
    if (prompt) {
      document.getElementById('ws-music-title')?.setAttribute('data-lil-mystic-prompt', promptText);
    }
    if (window.nlblAI && !window.nlblAI.isReady) {
      await window.nlblAI.initialize();
      renderMysticStatus();
    }

    let beat = '';
    if (window.nlblAI && window.nlblAI.isReady) {
      beat = await window.nlblAI.generateText(promptText, 140);
    }
    if (!beat) {
      beat = await fetchAIFallback(promptText) || '120 BPM, layered synth arpeggio, punchy kick, snappy hi-hats, low sub bass, and a spacious bridge for vocal performance.';
    }

    state.studio.generatedBeat = beat;
    output.textContent = beat;
    return beat;
  } catch (err) {
    console.error('Beat generation failed:', err);
    output.textContent = 'Unable to generate a beat right now.';
    return '';
  } finally {
    state.studio.isGenerating = false;
  }
}

async function generateWorkshopLyrics(theme = null) {
  const output = document.getElementById('lyrics-output');
  if (!output || state.studio.isGenerating) return '';
  state.studio.isGenerating = true;
  output.textContent = 'Writing lyrics...';

  try {
    const themeText = theme || document.getElementById('lyrics-theme')?.value.trim() || 'resilience and legacy';
    if (theme && document.getElementById('lyrics-theme')) {
      document.getElementById('lyrics-theme').value = themeText;
    }
    const prompt = `Write powerful hip-hop lyrics about ${themeText}. Keep it cinematic, motivational, and studio-ready.`;
    if (window.nlblAI && !window.nlblAI.isReady) {
      await window.nlblAI.initialize();
      renderMysticStatus();
    }

    let lyrics = '';
    if (window.nlblAI && window.nlblAI.isReady) {
      lyrics = await window.nlblAI.generateText(prompt, 180);
    }
    if (!lyrics) {
      lyrics = await fetchAIFallback(prompt) || `In the midnight glow I rise, legacy across the skies.
Built from grit, heart, and fight, I press my truth into the night.`;
    }

    state.studio.generatedLyrics = lyrics;
    output.textContent = lyrics;
    return lyrics;
  } catch (err) {
    console.error('Lyrics generation failed:', err);
    output.textContent = 'Unable to generate lyrics right now.';
    return '';
  } finally {
    state.studio.isGenerating = false;
  }
}

async function composeWorkshopSong() {
  const output = document.getElementById('song-output');
  const exportStatus = document.getElementById('song-export-status');
  if (!output || state.studio.isGenerating) return;
  state.studio.isGenerating = true;

  try {
    const beat = state.studio.generatedBeat || await generateWorkshopBeat();
    const lyrics = state.studio.generatedLyrics || await generateWorkshopLyrics();
    const summary = `Song Preview:\n\nBeat:\n${typeof beat === 'string' ? beat : ''}\n\nLyrics:\n${typeof lyrics === 'string' ? lyrics : ''}`;
    output.textContent = summary;
    state.studio.composedSong = summary;
    if (exportStatus) {
      exportStatus.textContent = 'Ready to save or download your composition.';
    }
  } catch (err) {
    console.error('Song composition failed:', err);
    output.textContent = 'Unable to compose the song preview.';
    if (exportStatus) {
      exportStatus.textContent = 'Composition failed. Try generating again.';
    }
  } finally {
    state.studio.isGenerating = false;
  }
}

function initDesignLab() {
  const container = document.getElementById("design-lab-container");
  if (!container) return;
  container.innerHTML = `
    <div class="design-lab-shell">
      <section class="design-card">
        <h3>Design Vision</h3>
        <input id="ws-design-prompt" class="studio-input" placeholder="Design prompt" />
        <div class="studio-meta-grid">
          <input id="ws-design-medium" class="studio-input" placeholder="Medium (print, apparel, poster)" />
          <input id="ws-design-style" class="studio-input" placeholder="Style" />
          <input id="ws-design-palette" class="studio-input" placeholder="Palette" />
        </div>
        <button id="design-generate-btn" class="action-btn">Generate Design Concepts</button>
        <button id="ws-mystic-design-btn" class="action-btn secondary">Generate with Lil Mystic</button>
      </section>
      <section class="design-card">
        <h3>Generated Concepts</h3>
        <div id="ws-design-output" class="design-ideas">Design concepts will appear here after generation.</div>
        <div id="design-export-status" class="studio-meta">Save, publish, or download your latest design concepts.</div>
        <div class="studio-actions" style="margin-top: 1rem; display:flex; gap:0.75rem; flex-wrap:wrap;">
          <button id="ws-design-save-btn" class="action-btn secondary">Save Concept</button>
          <button id="ws-mystic-publish-design-btn" class="action-btn accent">Publish Concept</button>
          <button id="ws-design-download-btn" class="action-btn tertiary">Download Concept</button>
        </div>
      </section>
    </div>`;

  bindDesignLabEvents();
}

function bindDesignLabEvents() {
  const button = document.getElementById('design-generate-btn');
  const saveButton = document.getElementById('ws-design-save-btn');
  const downloadButton = document.getElementById('ws-design-download-btn');

  if (button) {
    button.addEventListener('click', async () => {
      await generateDesignIdeas();
    });
  }

  const mysticDesignBtn = document.getElementById('ws-mystic-design-btn');
  if (mysticDesignBtn) {
    mysticDesignBtn.addEventListener('click', async () => {
      await WorkshopUI.runAction(
        mysticDesignBtn,
        () => window.LilMysticBridge?.generateAndApplyDesign(),
        'Generating design concepts with Lil Mystic...',
        'Lil Mystic generated your design concepts successfully!'
      );
    });
  }

  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      await saveDesignConcept(saveButton);
    });
  }

  const publishButton = document.getElementById('ws-mystic-publish-design-btn');
  if (publishButton) {
    publishButton.addEventListener('click', async () => {
      await WorkshopUI.runAction(
        publishButton,
        () => window.LilMysticBridge?.publishDesignToShop(),
        'Publishing your design through Lil Mystic...',
        'Design published and catalog refreshed successfully!'
      );
    });
  }

  if (downloadButton) {
    downloadButton.addEventListener('click', async () => {
      await downloadDesignConcept();
    });
  }
}

async function generateDesignIdeas(prompt = null, opts = {}) {
  const output = document.getElementById('design-ideas');
  const designPrompt = prompt || document.getElementById('ws-design-prompt')?.value.trim() || 'cosmic streetwear with legacy vibes';
  const status = document.getElementById('design-export-status');
  if (!output) return [];
  status && (status.textContent = 'Crafting design concepts...');
  if (prompt && document.getElementById('ws-design-prompt')) {
    document.getElementById('ws-design-prompt').value = designPrompt;
  }
  if (opts.medium && document.getElementById('ws-design-medium')) {
    document.getElementById('ws-design-medium').value = opts.medium;
  }
  if (opts.style && document.getElementById('ws-design-style')) {
    document.getElementById('ws-design-style').value = opts.style;
  }
  if (opts.palette && document.getElementById('ws-design-palette')) {
    document.getElementById('ws-design-palette').value = opts.palette;
  }

  try {
    if (window.nlblAI && !window.nlblAI.isReady) {
      await window.nlblAI.initialize();
      renderMysticStatus();
    }

    let ideas = [];
    if (window.nlblAI && window.nlblAI.isReady) {
      const suggestion = await window.nlblAI.suggestDesignIdeas(theme);
      ideas = suggestion.split('\n').filter((line) => line.trim());
    }

    if (!ideas.length) {
      const remoteIdeas = await fetchAIFallback(`Suggest 3 creative design ideas for a ${theme} themed clothing line. Make them unique and appealing.`);
      if (remoteIdeas) {
        ideas = remoteIdeas.split('\n').filter((line) => line.trim());
      }
    }

    if (!ideas.length) {
      ideas = [
        `A black-and-purple bomber jacket with cosmic embroidery and reflective stitching.`,
        `A layered streetwear tee with galaxy gradients, bold text, and polished neon accents.`,
        `A limited edition drop featuring hand-drawn astral symbols and luxe metallic highlights.`
      ];
    }

    state.studio.generatedDesignIdeas = ideas;
    output.innerHTML = ideas.map((idea) => `<div class="design-idea">${escapeHTML(idea)}</div>`).join('');
    status && (status.textContent = 'Design concepts ready. Save or download them anytime.');
  } catch (err) {
    console.error('Design idea generation failed:', err);
    output.textContent = 'Unable to generate design ideas right now.';
    status && (status.textContent = 'Design generation failed. Try again.');
  }
}

async function saveDesignConcept(btnElem) {
  return WorkshopUI.runAction(
    btnElem,
    async () => {
      if (!state.studio.generatedDesignIdeas?.length) {
        throw new Error('No design concepts available to save. Generate them first.');
      }

      const prompt = document.getElementById('ws-design-prompt')?.value.trim() || 'Untitled Concept';
      const medium = document.getElementById('ws-design-medium')?.value.trim() || 'apparel';
      const style = document.getElementById('ws-design-style')?.value.trim() || 'cosmic';
      const palette = document.getElementById('ws-design-palette')?.value.trim() || 'galaxy';
      const outputHtml = state.studio.generatedDesignIdeas.join('\n\n');

      WorkshopUI.logConsole(`🎨 [Design Lab] Saving design concept "${prompt}"...`);
      return await saveStudioExport('design_lab', prompt, {
        prompt,
        medium,
        style,
        palette,
        concepts: state.studio.generatedDesignIdeas,
        output: outputHtml,
        generatedAt: new Date().toISOString(),
      });
    },
    'Saving design concept...',
    'Design concept successfully saved to studio vault!'
  );
}

async function downloadDesignConcept() {
  if (!state.studio.generatedDesignIdeas?.length) {
    WorkshopUI.notify('No generated design ideas to download.', 'warning');
    return;
  }

  const payload = {
    prompt: document.getElementById('ws-design-prompt')?.value.trim() || 'Untitled Concept',
    medium: document.getElementById('ws-design-medium')?.value.trim() || 'apparel',
    style: document.getElementById('ws-design-style')?.value.trim() || 'cosmic',
    palette: document.getElementById('ws-design-palette')?.value.trim() || 'galaxy',
    concepts: state.studio.generatedDesignIdeas,
    downloadedAt: new Date().toISOString(),
  };

  downloadJsonFile(`design-concept-${Date.now()}.json`, payload);
}

async function saveMusicComposition(btnElem) {
  return WorkshopUI.runAction(
    btnElem,
    async () => {
      if (!state.studio.composedSong) {
        throw new Error('Compose the song first before saving it.');
      }

      const title = document.getElementById('ws-music-title')?.value.trim() || 'Untitled Track';
      const genre = document.getElementById('ws-music-genre')?.value.trim() || 'hip-hop';
      const bpm = document.getElementById('ws-music-bpm')?.value.trim() || '120';
      const key = document.getElementById('ws-music-key')?.value.trim() || 'C minor';
      const lyrics = document.getElementById('ws-music-lyrics')?.value.trim() || state.studio.generatedLyrics || '';
      const audioUrl = document.getElementById('ws-music-output')?.querySelector('audio')?.src || null;

      WorkshopUI.logConsole(`🎵 [Music Studio] Saving composition "${title}"...`);
      return await saveStudioExport('music_studio', title, {
        title,
        genre,
        bpm,
        key,
        lyrics,
        beat: state.studio.generatedBeat || '',
        composition: state.studio.composedSong,
        audioUrl,
        savedAt: new Date().toISOString(),
      });
    },
    'Saving composition...',
    'Music composition successfully saved to studio vault!'
  );
}

async function downloadMusicComposition() {
  if (!state.studio.composedSong) {
    WorkshopUI.notify('No composition available to download. Compose a song first.', 'warning');
    return;
  }

  const payload = {
    title: document.getElementById('ws-music-title')?.value.trim() || 'Untitled Track',
    genre: document.getElementById('ws-music-genre')?.value.trim() || 'hip-hop',
    bpm: document.getElementById('ws-music-bpm')?.value.trim() || '120',
    key: document.getElementById('ws-music-key')?.value.trim() || 'C minor',
    lyrics: document.getElementById('ws-music-lyrics')?.value.trim() || state.studio.generatedLyrics || '',
    composition: state.studio.composedSong,
    downloadedAt: new Date().toISOString(),
  };

  downloadJsonFile(`music-composition-${Date.now()}.json`, payload);
}

function downloadJsonFile(filename, data) {
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function saveStudioExport(type, title, payload) {
  const token = localStorage.getItem('ADMIN_API_TOKEN') || '';
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetchJSON('/api/studio', {
    method: 'POST',
    headers,
    body: JSON.stringify({ type, title, payload }),
  });

  if (!response.success) {
    throw new Error(response.error || 'Failed to save export to database.');
  }

  WorkshopUI.notify('Studio export saved successfully.', 'success');
  return response;
}

function logWorkshopEvent(msg, type = 'system') {
  const sender = type === 'user' ? 'user' : type === 'mystic' ? 'ai' : 'system';
  const message = `[${new Date().toLocaleTimeString()}] ${msg}`;
  if (document.getElementById('mystic-chat-log')) {
    addMysticMessage(message, sender);
  } else {
    console.log(`[Lil Mystic] ${message}`);
  }
}

// --- 🔥 PHASE 4: THE EMOTIONAL EXPERIENCE (THE HEART) ---

async function initEmotionalExperience() {
  const container = document.getElementById("tribute-container");
  if (!container) return;
  container.innerHTML = `
    <div class="heart-interface">
      <div class="tribute-header">
        <h2>Eternal Reflections</h2>
        <p class="spiritual-subtitle">No Limits Beyond Limitations</p>
      </div>
      <div id="sacred-gallery" class="reflection-grid"></div>
      <div class="emotional-controls">
        <button class="action-btn" onclick="triggerMoodPulse('remembrance')">Initiate Pulse</button>
      </div>
    </div>`;
  await loadTributeElements();
  enterTributeResonance();
}

function enterTributeResonance() {
  document.body.setAttribute("data-mood", "remembrance");
  logWorkshopEvent("Entering Tribute Resonance Mode...");

  if (!window.lilMystic) return;

  // Mood + color
  window.lilMystic.setMood("remembrance");

  // Soft “spirit is here” pulse
  window.lilMystic.onSpeak(0.15);
  setTimeout(() => window.lilMystic.onListen(), 3000);

  // Slow sacred rotation of rings
  window.lilMystic.rings.forEach(r => {
    r.speed = 0.05;
  });

  // Subtle bow of the avatar (respect)
  if (window.lilMystic.avatar) {
    window.lilMystic.avatar.rotation.x = -0.25;
  }

  logWorkshopEvent("Eternal Reflections online.");
}

async function loadTributeElements() {
  try {
    const data = await fetchJSON("/api/gallery");
    const items = data.items || [];
    const tributeItems = items.filter(item => 
      item.category === "tribute" || 
      item.cosmic_text?.toLowerCase().includes("rj") || 
      item.cosmic_text?.toLowerCase().includes("mainney")
    );
    const gallery = document.getElementById("sacred-gallery");
    if (gallery) {
      gallery.innerHTML = tributeItems.map(item => `
        <div class="reflection-card quantum-card">
          <img src="${escapeHTML(resolveGalleryImageUrl(item))}" alt="Legacy">
          <div class="reflection-overlay"><p>${escapeHTML(item.cosmic_text || "")}</p></div>
        </div>`).join("");
    }
  } catch (err) { logWorkshopEvent(`Sacred Archive Sync Error: ${err.message}`, "error"); }
}

function triggerMoodPulse(mood) {
  state.heart.currentMood = mood;
  document.body.setAttribute("data-mood", mood);
  logWorkshopEvent(`Emotional frequency set to: ${mood.toUpperCase()}`);
  updateWorkshopLighting(mood);
  if (window.lilMystic) {
    window.lilMystic.setMood(mood);
  }
}

function updateWorkshopLighting(mood) {
  const root = document.documentElement;
  const colors = {
    neutral: { primary: "#00f2ff", secondary: "rgba(0, 242, 255, 0.1)" },
    remembrance: { primary: "#7000ff", secondary: "rgba(112, 0, 255, 0.15)" },
    talking: { primary: "#ff00d4", secondary: "rgba(255, 0, 212, 0.1)" },
    build: { primary: "#00ff88", secondary: "rgba(0, 255, 136, 0.1)" },
    storm: { primary: "#ff3b3b", secondary: "rgba(255, 59, 59, 0.15)" },
    recovery: { primary: "#4fffb0", secondary: "rgba(79, 255, 176, 0.15)" }
  };
  const theme = colors[mood] || colors.neutral;
  root.style.setProperty('--mystic-primary', theme.primary);
  root.style.setProperty('--mystic-glow', theme.secondary);

  // Update HUD values
  const moodVal = document.getElementById("hud-mood-value");
  if (moodVal) moodVal.textContent = mood.toUpperCase();
}

/**
 * Cosmic HUD - Persistent system overlay
 */
function createCosmicHUD() {
  if (document.getElementById("cosmic-hud")) return;
  const hud = document.createElement("div");
  hud.id = "cosmic-hud";
  hud.className = "floating-hud fade-in";
  hud.innerHTML = `
    <div class="hud-item"><small>MOOD</small><span id="hud-mood-value">NEUTRAL</span></div>
    <div class="hud-item"><small>RESONANCE</small><div class="hud-meter"><div id="hud-resonance-fill" class="hud-fill" style="width: 40%"></div></div></div>
    <div class="hud-item"><small>INTEGRITY</small><div class="hud-meter"><div id="hud-integrity-fill" class="hud-fill" style="width: 100%"></div></div></div>
    <div class="hud-item"><small>PULSE</small><span id="hud-pulse-value">STABLE</span></div>
    <div class="hud-item"><small>SPIRIT</small><span>ONLINE</span></div>
  `;
  document.body.appendChild(hud);

  // Ambient pulse for HUD
  setInterval(() => {
    const pulse = document.getElementById("hud-pulse-value");
    if (pulse) pulse.style.opacity = pulse.style.opacity === "0.5" ? "1" : "0.5";
  }, 1500);
}

async function attemptAutoRecovery() {
  logWorkshopEvent("Attempting auto-recovery...", "system");
  updateWorkshopLighting("recovery");

  window.lilMystic?.setGuardianStatus("warning");
  window.lilMystic?.performGesture("focus");

  try {
    const response = await fetch("/api/agent?action=heartbeat", { credentials: 'include' });
    if (response.status === 401) {
      window.location.href = '/workshop-login.html';
      return false;
    }
    const data = await response.json();

    logWorkshopEvent("Auto-recovery successful. Systems restored.", "system");
    updateWorkshopLighting("neutral");

    window.lilMystic?.setGuardianStatus("ok");
    window.lilMystic?.triggerRecoveryPulse();
    window.lilMystic?.onSpeak(0.2);
    setTimeout(() => window.lilMystic?.onListen(), 1500);
    return true;
  } catch (err) {
    logWorkshopEvent("Auto-recovery failed. Manual intervention required.", "error");
    updateWorkshopLighting("storm");
    document.getElementById("hud-integrity-fill").style.width = "20%";
    window.lilMystic?.triggerGlitch();
    return false;
  }
}

function enterDeepWorkMode() {
  logWorkshopEvent("Entering Deep Work Mode...");
  document.body.setAttribute("data-mood", "build");
  window.lilMystic?.enterDeepWork();
}

function exitDeepWorkMode() {
  logWorkshopEvent("Exiting Deep Work Mode.");
  document.body.setAttribute("data-mood", "neutral");
  window.lilMystic?.exitDeepWork();
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function resolveProductImageUrl(product) {
  if (!product) return "/placeholder-product.png";
  const imageUrl = product.image_url || product.image_filename || "";
  if (!imageUrl) return "/placeholder-product.png";
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith("/")) return imageUrl;
  return `/products/${imageUrl}`;
}

function resolveGalleryImageUrl(item) {
  if (!item) return "";
  if (item.image_url) return item.image_url;
  if (item.filename && /^https?:\/\//i.test(item.filename)) return item.filename;
  if (item.filename) return `/remembrance/Stand_Still_photos/${item.filename}`;
  return "";
}

async function loadOrders() {
  const tbody = document.querySelector("#orders-table tbody");
  const statusEl = document.getElementById("orders-status");
  if (!tbody || !statusEl) return;

  statusEl.textContent = "Refreshing orders...";
  tbody.innerHTML = "";

  try {
    const data = await fetchJSON("/api/orders");
    const orders = Array.isArray(data) ? data : data.orders || [];
    state.orders = orders;

    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="8">No orders found.</td></tr>';
      statusEl.textContent = "No orders found.";
      return;
    }

    orders.forEach((order) => {
      const status = order.fulfillment_status === "fulfilled" ? "Fulfilled" : "Pending";
      const nextStatus = order.fulfillment_status === "fulfilled" ? "pending" : "fulfilled";
      const toggleLabel = nextStatus === "fulfilled" ? "Mark Fulfilled" : "Mark Pending";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHTML(String(order.id))}</td>
        <td>${escapeHTML(order.product_id || "N/A")}</td>
        <td>${formatCurrency(order.amount)}</td>
        <td>${escapeHTML(order.buyer_name || "Unknown")}</td>
        <td>${escapeHTML(order.buyer_email || "Unknown")}</td>
        <td>${escapeHTML(status)}</td>
        <td>${formatDate(order.created_at)}</td>
        <td>
          <button class="action-btn order-detail-btn" data-id="${order.id}">Details</button>
          <button class="action-btn order-toggle-btn" data-id="${order.id}" data-next-status="${nextStatus}">
            ${toggleLabel}
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    tbody.querySelectorAll(".order-detail-btn").forEach((btn) => {
      btn.addEventListener("click", () => openOrderModal(Number(btn.dataset.id)));
    });

    tbody.querySelectorAll(".order-toggle-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const orderId = Number(btn.dataset.id);
        const nextStatus = btn.dataset.nextStatus || "pending";
        const order = state.orders.find((item) => Number(item.id) === orderId);
        await updateOrderFulfillment(orderId, nextStatus, order?.fulfillment_notes || "");
      });
    });

    statusEl.textContent = `Loaded ${orders.length} order${orders.length === 1 ? "" : "s"}.`;
    return orders.length;
  } catch (error) {
    console.error(error);
    tbody.innerHTML = '<tr><td colspan="8">Unable to load orders.</td></tr>';
    statusEl.textContent = "Unable to load orders.";
    return 0;
  }
}

function openOrderModal(orderId) {
  const modal = document.getElementById("order-modal");
  const title = document.getElementById("order-modal-title");
  const grid = document.getElementById("order-detail-grid");
  const notesInput = document.getElementById("order-fulfillment-notes");
  const statusSelect = document.getElementById("order-fulfillment-status");
  const saveStatus = document.getElementById("order-fulfillment-status-text");
  if (!modal || !title || !grid || !notesInput || !statusSelect || !saveStatus) return;

  const order = state.orders.find((item) => Number(item.id) === Number(orderId));
  if (!order) return;

  state.activeOrderId = Number(orderId);
  title.textContent = `Order #${order.id}`;
  grid.innerHTML = `
    <div><small>Order ID</small>${order.id}</div>
    <div><small>PayPal Order ID</small>${order.paypal_order_id || "N/A"}</div>
    <div><small>Product</small>${order.product_id || "N/A"}</div>
    <div><small>Amount</small>${formatCurrency(order.amount)}</div>
    <div><small>Buyer</small>${order.buyer_name || "Unknown"}</div>
    <div><small>Email</small>${order.buyer_email || "Unknown"}</div>
    <div><small>Created</small>${formatDate(order.created_at)}</div>
    <div><small>Fulfilled At</small>${formatDate(order.fulfilled_at)}</div>
  `;
  notesInput.value = order.fulfillment_notes || "";
  statusSelect.value = order.fulfillment_status === "fulfilled" ? "fulfilled" : "pending";
  saveStatus.textContent = "";
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function closeOrderModal() {
  const modal = document.getElementById("order-modal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  state.activeOrderId = null;
}

async function updateOrderFulfillment(orderId, fulfillmentStatus, fulfillmentNotes) {
  const statusEl = document.getElementById("orders-status");
  const modalStatus = document.getElementById("order-fulfillment-status-text");

  try {
    if (statusEl) statusEl.textContent = "Saving fulfillment update...";
    if (modalStatus) modalStatus.textContent = "Saving...";

    const response = await fetch("/api/orders", {
      method: "PUT",
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: orderId,
        fulfillment_status: fulfillmentStatus,
        fulfillment_notes: fulfillmentNotes,
      }),
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Fulfillment update failed");
    }

    if (modalStatus) modalStatus.textContent = "Saved.";
    await loadOrders();
    closeOrderModal();
  } catch (error) {
    console.error(error);
    if (statusEl) statusEl.textContent = error.message || "Unable to update fulfillment.";
    if (modalStatus) modalStatus.textContent = error.message || "Unable to save.";
  }
}

async function loadMessages() {
  const filter = document.getElementById("messages-filter")?.value;
  const q = document.getElementById("messages-search")?.value.trim();
  const statusEl = document.getElementById("messages-status");
  if (!statusEl) return;

  statusEl.textContent = "Refreshing messages...";

  try {
    const params = new URLSearchParams();
    if (filter && filter !== "all") params.set("filter", filter);
    if (q) params.set("q", q);

    const data = await fetchJSON(`/api/messages?${params.toString()}`);
    const messages = data.messages || [];
    messagesState.list = messages;

    renderMessagesTable();

    statusEl.textContent = `Loaded ${messages.length} message${messages.length === 1 ? "" : "s"}.`;
  } catch (error) {
    console.error(error);
    const tbody = document.querySelector("#messages-table tbody");
    if (tbody) tbody.innerHTML = '<tr><td colspan="6">Unable to load messages.</td></tr>';
    statusEl.textContent = "Unable to load messages.";
  }
}

function renderMessagesTable() {
  const tbody = document.querySelector("#messages-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  messagesState.list.forEach((msg) => {
    const preview = msg.message.length > 40 ? msg.message.slice(0, 40) + "…" : msg.message;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHTML(msg.name || "Anonymous")}</td>
      <td>${escapeHTML(preview)}</td>
      <td>${msg.approved ? "Yes" : "No"}</td>
      <td>${msg.hidden ? "Yes" : "No"}</td>
      <td>${formatDate(msg.created_at)}</td>
      <td>
        <button class="action-btn" data-action="view" data-id="${msg.id}">View</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('button[data-action="view"]').forEach((btn) => {
    btn.addEventListener("click", () => openMessageModal(btn.dataset.id));
  });
}

function openMessageModal(id) {
  const msg = messagesState.list.find(m => String(m.id) === String(id));
  if (!msg) return;

  messagesState.selected = msg;

  document.getElementById("modal-message-name").textContent = msg.name || "Anonymous";
  document.getElementById("modal-message-text").textContent = msg.message || "";
  document.getElementById("modal-message-approved").checked = !!msg.approved;
  document.getElementById("modal-message-hidden").checked = !!msg.hidden;
  document.getElementById("modal-message-notes").value = msg.admin_notes || "";

  const modal = document.getElementById("message-modal");
  if (modal) {
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
  }
}

function closeMessageModal() {
  const modal = document.getElementById("message-modal");
  if (modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
  messagesState.selected = null;
}

async function saveMessageModeration() {
  if (!messagesState.selected) return;

  const id = messagesState.selected.id;
  const approved = document.getElementById("modal-message-approved").checked;
  const hidden = document.getElementById("modal-message-hidden").checked;
  const admin_notes = document.getElementById("modal-message-notes").value.trim();

  try {
    const res = await fetch("/api/messages", {
      method: "PUT",
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, approved, hidden, admin_notes }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to save message");
    }
    await loadMessages();
    closeMessageModal();
  } catch (error) {
    console.error(error);
    const statusEl = document.getElementById("messages-status");
    if (statusEl) statusEl.textContent = error.message || "Failed to save message.";
  }
}

async function deleteMessage() {
  if (!messagesState.selected) return;
  const id = messagesState.selected.id;

  if (!confirm("Delete this message permanently?")) return;

  try {
    const res = await fetch("/api/messages", {
      method: "DELETE",
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to delete message");
    }
    await loadMessages();
    closeMessageModal();
  } catch (error) {
    console.error(error);
    const statusEl = document.getElementById("messages-status");
    if (statusEl) statusEl.textContent = error.message || "Failed to delete message.";
  }
}

function initMessagesSection() {
  document.getElementById("messages-refresh")?.addEventListener("click", loadMessages);
  document.getElementById("messages-filter")?.addEventListener("change", loadMessages);
  document.getElementById("messages-search")?.addEventListener("keyup", (e) => {
    if (e.key === "Enter") loadMessages();
  });

  document.getElementById("modal-message-save")?.addEventListener("click", saveMessageModeration);
  document.getElementById("modal-message-delete")?.addEventListener("click", deleteMessage);
  document.getElementById("modal-message-close")?.addEventListener("click", closeMessageModal);
  document.getElementById("message-modal-close")?.addEventListener("click", closeMessageModal);
  const messageModal = document.getElementById("message-modal");
  messageModal?.addEventListener("click", (e) => {
    if (e.target === messageModal) closeMessageModal();
  });
}

function uploadGalleryFile() {
  const uploadButton = document.getElementById("upload-btn");
  const uploadInput = document.getElementById("gallery-upload");
  const galleryCategory = document.getElementById("gallery-category");
  const statusEl = document.getElementById("gallery-status");
  if (!uploadButton || !uploadInput || !galleryCategory || !statusEl) return;

  uploadButton.addEventListener("click", async () => {
    const file = uploadInput.files[0];
    if (!file) {
      statusEl.textContent = "Please choose a file first.";
      return;
    }

    statusEl.textContent = "Uploading...";
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", galleryCategory.value || "memories");

      const response = await fetch("/api/gallery", {
        method: "POST",
        credentials: 'include',
        body: formData,
      });
      const result = await response.json();

      if (!result.success) {
        statusEl.textContent = result.error || "Upload failed.";
        return;
      }

      statusEl.textContent = "Upload successful.";
      uploadInput.value = "";
      await Promise.all([loadGallery(), loadGalleryAdmin()]);
    } catch (error) {
      console.error(error);
      statusEl.textContent = "Upload failed.";
    }
  });
}

async function loadGallery() {
  const container = document.getElementById("gallery-items");
  const statusEl = document.getElementById("gallery-status");
  if (!container || !statusEl) return;

  container.innerHTML = "";
  statusEl.textContent = "Refreshing gallery...";

  try {
    const res = await fetch("/api/gallery", { credentials: 'include' });
    const items = await res.json();
    const galleryItems = Array.isArray(items) ? items : items.items || [];

    if (!galleryItems.length) {
      container.innerHTML = '<div class="message-box">No gallery images found.</div>';
      statusEl.textContent = "No gallery images found.";
      return;
    }

    galleryItems.forEach((item) => {
      const imageUrl = resolveGalleryImageUrl(item);
      const card = document.createElement("div");
      card.className = "message-box";
      card.style.display = "flex";
      card.style.alignItems = "center";
      card.style.gap = "12px";
      card.innerHTML = `
        <img src="${imageUrl}" alt="${item.original_name || "Uploaded"}"
          style="width:96px; height:auto; border-radius:12px; object-fit:cover;" />
        <div>
          <strong>${item.original_name || "Uploaded image"}</strong><br />
          <small>${formatDate(item.uploaded_at)}</small>
        </div>
      `;
      container.appendChild(card);
    });

    statusEl.textContent = `Loaded ${galleryItems.length} gallery item${galleryItems.length === 1 ? "" : "s"}.`;
  } catch (error) {
    console.error(error);
    container.innerHTML = '<div class="message-box">Unable to load gallery images.</div>';
    statusEl.textContent = "Unable to load gallery.";
  }
}

async function loadGalleryAdmin() {
  const container = document.getElementById("gallery-admin");
  if (!container) return;

  container.innerHTML = "";
  try {
    const res = await fetch("/api/gallery", { credentials: 'include' });
    const items = await res.json();
    const galleryItems = Array.isArray(items) ? items : items.items || [];

    if (!galleryItems.length) {
      container.innerHTML = '<div class="message-box">No gallery uploads yet.</div>';
      return;
    }

    galleryItems.forEach((item) => {
      const imageUrl = resolveGalleryImageUrl(item);
      const card = document.createElement("div");
      card.className = "gallery-item";
      card.innerHTML = `
        <img src="${imageUrl}" alt="${item.original_name || "Uploaded"}" />
        <div style="flex:1;">
          <p><strong>${item.original_name || "Uploaded image"}</strong></p>
          <p style="margin:6px 0 0; color:#aaa;">${item.category || "memories"}</p>
        </div>
        <button data-id="${item.id}" class="delete-btn">Delete</button>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await fetch("/api/gallery", {
          method: "DELETE",
          credentials: 'include',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: btn.dataset.id }),
        });
        await Promise.all([loadGallery(), loadGalleryAdmin()]);
      });
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = '<div class="message-box">Unable to load gallery uploads.</div>';
  }
}

async function loadProducts() {
  const tbody = document.querySelector("#products-table tbody");
  if (!tbody) return;
  try {
    const data = await fetchJSON("/api/products");
    if (!data.success) return;

    tbody.innerHTML = "";
    state.products = data.products || []; // Sync local state
    data.products.forEach((product) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHTML(String(product.id))}</td>
        <td>${escapeHTML(product.name)}</td>
        <td>${formatCurrency(product.price)}</td>
        <td>${product.active ? "Yes" : "No"}</td>
        <td>
          <button data-id="${product.id}" class="prod-edit action-btn">Edit</button>
          <button data-id="${product.id}" class="prod-delete action-btn" style="background:#ff3b3b; border-color:#ff6b6b;">
            Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".prod-edit").forEach((btn) => {
      btn.addEventListener("click", () => editProduct(btn.dataset.id));
    });
    tbody.querySelectorAll(".prod-delete").forEach((btn) => {
      btn.addEventListener("click", () => deleteProduct(btn.dataset.id));
    });
    return (data.products || []).length;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

async function editProduct(id) {
  const statusEl = document.getElementById("prod-status");
  try {
    const res = await fetch(`/api/products/${id}`, { credentials: 'include' });
    const data = await res.json();
    if (!data.success) {
      if (statusEl) statusEl.textContent = data.error || "Unable to load product.";
      return;
    }

    const product = data.product;
    document.getElementById("prod-id").value = product.id;
    document.getElementById("prod-name").value = product.name || "";
    document.getElementById("prod-desc").value = product.description || "";
    document.getElementById("prod-price").value = product.price ?? "";
    document.getElementById("prod-category").value = product.category || "";
    document.getElementById("prod-active").checked = !!product.active;
    if (statusEl) {
      statusEl.textContent = `Editing product #${product.id} (${resolveProductImageUrl(product)})`;
    }
  } catch (error) {
    console.error(error);
    if (statusEl) statusEl.textContent = "Unable to load product.";
  }
}

async function deleteProduct(id) {
  if (!confirm("Delete this product permanently?")) return;
  await fetch(`/api/products/${id}`, { method: "DELETE", credentials: 'include' });
  await loadProducts();
}

async function saveProduct() {
  const id = document.getElementById("prod-id").value;
  const name = document.getElementById("prod-name").value.trim();
  const description = document.getElementById("prod-desc").value.trim();
  const price = document.getElementById("prod-price").value;
  const category = document.getElementById("prod-category").value.trim();
  const active = document.getElementById("prod-active").checked;
  const fileInput = document.getElementById("prod-image");
  const statusEl = document.getElementById("prod-status");

  if (!name || !price) {
    statusEl.textContent = "Name and price are required.";
    return;
  }

  let imageUrl = null;
  if (fileInput.files[0]) {
    statusEl.textContent = "Uploading image...";
    const fd = new FormData();
    fd.append("file", fileInput.files[0]);

    const uploadRes = await fetch("/api/uploads", { method: "POST", credentials: 'include', body: fd });
    let uploadData;
    try {
      uploadData = await uploadRes.json();
    } catch (err) {
      statusEl.textContent = "Image upload failed (invalid response).";
      return;
    }
    if (!uploadData || !uploadData.success) {
      statusEl.textContent = (uploadData && (uploadData.error || uploadData.message)) || "Image upload failed.";
      return;
    }
    imageUrl = resolveUploadUrl(uploadData) || uploadData.filename || null;
    if (!imageUrl) {
      statusEl.textContent = "Image uploaded but URL could not be resolved.";
      return;
    }
  }

  const payload = { name, description, price, category, active };
  if (imageUrl) payload.image_url = imageUrl;

  const method = id ? "PUT" : "POST";
  const url = id ? `/api/products/${id}` : "/api/products";

  statusEl.textContent = "Saving product...";
  try {
    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) {
      statusEl.textContent = data.error || "Save failed.";
      return;
    }

    statusEl.textContent = "Product saved successfully.";
    document.getElementById("prod-id").value = "";
    fileInput.value = "";
    await loadProducts();
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Save failed.";
  }
}

function wireUiEvents() {
  document.getElementById("refresh-orders")?.addEventListener("click", loadOrders);
  document.getElementById("refresh-messages")?.addEventListener("click", loadMessages);
  document.getElementById("refresh-gallery")?.addEventListener("click", async () => {
    await Promise.all([loadGallery(), loadGalleryAdmin()]);
  });
  document.getElementById("prod-save")?.addEventListener("click", saveProduct);

  const modal = document.getElementById("order-modal");
  document.getElementById("order-modal-close")?.addEventListener("click", closeOrderModal);
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeOrderModal();
  });

  document.getElementById("order-fulfillment-save")?.addEventListener("click", async () => {
    if (!state.activeOrderId) return;
    const status = document.getElementById("order-fulfillment-status")?.value || "pending";
    const notes = document.getElementById("order-fulfillment-notes")?.value || "";
    await updateOrderFulfillment(state.activeOrderId, status, notes);
  });
}

async function initializeWorkshop() {
  wireUiEvents();
  uploadGalleryFile();
  initMessagesSection();
  
  // Load components individually to prevent one failure from stopping the OS boot
  const tasks = [
    { name: "Orders", fn: loadOrders },
    { name: "Messages", fn: loadMessages },
    { name: "Gallery", fn: loadGallery },
    { name: "Gallery Admin", fn: loadGalleryAdmin }
  ];

  for (const task of tasks) {
    try {
      await task.fn();
    } catch (e) {
      logWorkshopEvent(`Module Load Alert: ${task.name} offline.`, "error");
    }
  }

  logWorkshopEvent("Creation Studio & Emotional Engine Online.");
}

async function hideCosmicIntro() {
  const intro = document.getElementById("cosmic-intro");
  if (!intro) return;

  logWorkshopEvent("Initializing Heart & Subsystems...", "system");
  await new Promise(r => setTimeout(r, 600));
  
  logWorkshopEvent("Synchronizing holographic sub-systems...", "system");
  await new Promise(r => setTimeout(r, 800));

  logWorkshopEvent("Silent Spirits Legacy — Online.", "system");
  
  intro.classList.add("hidden");
  setTimeout(() => {
    intro.remove();
    createCosmicHUD();
  }, 900);
}

initializeWorkshop().then(() => {
  hideCosmicIntro();
});
