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
    generatedDesignIdeas: []
  },
  heart: {
    currentMood: "neutral",
    pulseInterval: null
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

function initLilMysticPanel() {
  const container = document.getElementById("lil-mystic-container");
  if (!container) return;

  container.innerHTML = `
    <div class="mystic-shell">
      <div id="mystic-holo" class="mystic-holo"></div>
      <div class="mystic-chat-panel">
        <div class="mystic-chat-header">
          <div>
            <h3>Lil Mystic</h3>
            <p class="panel-note">Your private creative AI.</p>
          </div>
          <span id="mystic-status" class="status-chip">Initializing AI…</span>
        </div>
        <div id="mystic-chat-log" class="mystic-chat-log"></div>
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
  renderMysticStatus();
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

async function askLilMystic(message) {
  addMysticMessage(`You: ${message}`, 'user');
  const placeholder = addMysticMessage('Lil Mystic is connecting to the studio...', 'system');

  if (window.nlblAI && !window.nlblAI.isReady) {
    await window.nlblAI.initialize();
    renderMysticStatus();
  }

  let reply = null;
  try {
    if (window.nlblAI && window.nlblAI.isReady) {
      reply = await window.nlblAI.generateText(`You are Lil Mystic, a private AI assistant. Respond with creative production guidance for this request: ${message}`, 150);
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

  const lower = message.toLowerCase();
  if (lower.includes('beat') || lower.includes('music')) {
    return 'Create a cinematic, bass-forward beat with shimmering synths, hard-hitting drums, and a hypnotic groove for the studio.';
  }
  if (lower.includes('lyrics') || lower.includes('song')) {
    return 'Write lyrics that speak to resilience, legacy, and the energy of the studio. Keep it vivid, powerful, and melodic.';
  }
  if (lower.includes('design') || lower.includes('visual')) {
    return 'Visualize a high-contrast streetwear line with cosmic embroidery, bold fonts, and a polished, futuristic edge.';
  }
  return `Lil Mystic is ready. Ask me to generate beats, lyrics, designs, or to sync orders.`;
}

window.addEventListener('ai-assistant-ready', renderMysticStatus);

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
        <button id="generate-beat-btn" class="action-btn">Generate Beat</button>
        <pre id="beat-output" class="studio-output">Ready to generate a custom beat blueprint.</pre>
      </section>
      <section class="studio-card">
        <h3>Lyrics Lab</h3>
        <textarea id="lyrics-theme" placeholder="Mood, story, or theme..."></textarea>
        <button id="generate-lyrics-btn" class="action-btn">Generate Lyrics</button>
        <pre id="lyrics-output" class="studio-output">Your next verse will be generated here.</pre>
      </section>
      <section class="studio-card">
        <h3>Compose Song</h3>
        <button id="compose-song-btn" class="action-btn">Compose Song</button>
        <pre id="song-output" class="studio-output">Combine your beat and lyrics into a complete production preview.</pre>
      </section>
    </div>`;

  bindMusicStudioEvents();
}

async function bindMusicStudioEvents() {
  const beatBtn = document.getElementById('generate-beat-btn');
  const lyricsBtn = document.getElementById('generate-lyrics-btn');
  const composeBtn = document.getElementById('compose-song-btn');

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
}

async function generateWorkshopBeat() {
  const output = document.getElementById('beat-output');
  if (!output || state.studio.isGenerating) return;
  state.studio.isGenerating = true;
  output.textContent = 'Generating a rhythm blueprint...';

  try {
    const prompt = `Create a cinematic hip-hop beat structure with atmospheric synths, tight 808s, crisp percussion, and a moody arrangement that feels like a private studio session.`;
    if (window.nlblAI && !window.nlblAI.isReady) {
      await window.nlblAI.initialize();
      renderMysticStatus();
    }

    let beat = '';
    if (window.nlblAI && window.nlblAI.isReady) {
      beat = await window.nlblAI.generateText(prompt, 140);
    }
    if (!beat) {
      beat = await fetchAIFallback(prompt) || '120 BPM, layered synth arpeggio, punchy kick, snappy hi-hats, low sub bass, and a spacious bridge for vocal performance.';
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

async function generateWorkshopLyrics() {
  const theme = document.getElementById('lyrics-theme')?.value.trim() || 'resilience and legacy';
  const output = document.getElementById('lyrics-output');
  if (!output || state.studio.isGenerating) return '';
  state.studio.isGenerating = true;
  output.textContent = 'Writing lyrics...';

  try {
    const prompt = `Write powerful hip-hop lyrics about ${theme}. Keep it cinematic, motivational, and studio-ready.`;
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
  if (!output || state.studio.isGenerating) return;
  state.studio.isGenerating = true;

  try {
    const beat = state.studio.generatedBeat || await generateWorkshopBeat();
    const lyrics = state.studio.generatedLyrics || await generateWorkshopLyrics();
    const summary = `Song Preview:\n\nBeat:\n${typeof beat === 'string' ? beat : ''}\n\nLyrics:\n${typeof lyrics === 'string' ? lyrics : ''}`;
    output.textContent = summary;
  } catch (err) {
    console.error('Song composition failed:', err);
    output.textContent = 'Unable to compose the song preview.';
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
        <textarea id="design-theme" placeholder="Describe your product, vibe, or concept..." rows="4"></textarea>
        <button id="design-generate-btn" class="action-btn">Generate Design Concepts</button>
      </section>
      <section class="design-card">
        <h3>Generated Concepts</h3>
        <div id="design-ideas" class="design-ideas">Design concepts will appear here after generation.</div>
      </section>
    </div>`;

  bindDesignLabEvents();
}

function bindDesignLabEvents() {
  const button = document.getElementById('design-generate-btn');
  if (!button) return;
  button.addEventListener('click', async () => {
    await generateDesignIdeas();
  });
}

async function generateDesignIdeas() {
  const output = document.getElementById('design-ideas');
  const theme = document.getElementById('design-theme')?.value.trim() || 'cosmic streetwear with legacy vibes';
  if (!output) return;
  output.textContent = 'Crafting design concepts...';

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
  } catch (err) {
    console.error('Design idea generation failed:', err);
    output.textContent = 'Unable to generate design ideas right now.';
  }
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

    if (state.activeOrderId === Number(orderId)) {
      openOrderModal(orderId);
    }
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

    const uploadRes = await fetch("/api/product-upload", { method: "POST", credentials: 'include', body: fd });
    const uploadData = await uploadRes.json();
    if (!uploadData.success) {
      statusEl.textContent = uploadData.error || "Image upload failed.";
      return;
    }
    imageUrl = uploadData.image_url || uploadData.url || uploadData.filename;
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
