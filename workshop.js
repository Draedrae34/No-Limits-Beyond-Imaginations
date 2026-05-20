// This file is the unified workshop.js, combining root and public/js/workshop.js

const state = {
  orders: [],
  activeOrderId: null,
  products: [], // From public/js/workshop.js
  activePanel: "overview", // From public/js/workshop.js
  studio: {
    isGenerating: false,
    terminalHistory: [],
    activeDraft: null
  },
  heart: {
    currentMood: "neutral",
    pulseInterval: null
  }
};

window.lilMystic = null;

// --- Utility Functions (from public/js/workshop.js, improved escapeHTML) ---
async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
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
  if (!window.lilMystic) {
    window.lilMystic = new LilMystic("lil-mystic-container");
    terminalLog("Lil Mystic hologram online.");
    window.lilMystic?.performGesture("greet");
  }
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
    if (panelId === "terminal") initTerminal();
    if (panelId === "tribute") initEmotionalExperience();
  });
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
    <div class="music-production-grid">
        <div class="studio-header">
            <h3>Sacred Frequency Producer</h3>
            <p class="panel-note">Aligning the soul with the sound of the legacy.</p>
        </div>
        <div class="mixer-strips">
            <div class="mixer-strip">
                <label>BASS</label>
                <input type="range" class="vertical-slider" orient="vertical">
                <button class="mute-toggle">M</button>
            </div>
            <div class="mixer-strip">
                <label>STARS</label>
                <input type="range" class="vertical-slider" orient="vertical">
                <button class="mute-toggle">M</button>
            </div>
            <div class="mixer-strip">
                <label>VOICE</label>
                <input type="range" class="vertical-slider" orient="vertical">
                <button class="mute-toggle">M</button>
            </div>
        </div>
        <div class="studio-actions">
            <button class="action-btn" onclick="window.lilMystic.onSpeak(0.5)">Test Harmonic</button>
            <button class="action-btn" id="start-stream">Master Track</button>
        </div>
    </div>`;
}

function initDesignLab() {
  const container = document.getElementById("design-lab-container");
  if (!container) return;
  container.innerHTML = `
    <div class="design-interface">
      <div class="design-header">
        <h3>Cosmic Manifestation Lab</h3>
        <p class="panel-note">Generating Galaxy-Theme All-Over Prints (Infant to Adult)</p>
      </div>
      <textarea id="design-lab-prompt" placeholder="Describe the galaxy pattern & logo placement..."></textarea>
      <div class="design-controls">
        <button class="quantum-btn" onclick="terminalLog('Manifesting Galaxy AOP across all size variants...')">Manifest Vision</button>
        <button class="action-btn" onclick="terminalLog('Logo Overlay: ACTIVE')">Apply Legacy Logo</button>
      </div>
      <div id="design-preview" class="preview-grid"></div>
    </div>`;
}

function initTerminal() {
  const output = document.getElementById("terminal-output");
  const input = document.getElementById("terminal-input");
  if (!output || !input) return;
  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const cmd = input.value.trim();
      input.value = "";
      terminalLog(`> ${cmd}`, 'user');
      await executeTerminalCommand(cmd);
    }
  });
  terminalLog("Lil Mystic Terminal Online. Awaiting orders, Aundrae.");
}

function terminalLog(msg, type = 'system') {
  const output = document.getElementById("terminal-output");
  if (!output) return;
  const line = document.createElement("div");
  line.className = `terminal-line ${type}`;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  
  // Keep terminal performance stable by limiting line count
  while (output.childNodes.length > 150) {
    output.removeChild(output.firstChild);
  }

  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

async function executeTerminalCommand(message) {
  try {
    const cmd = message.toLowerCase().trim();

    const localCommands = {
      focus: () => {
        enterDeepWorkMode();
        terminalLog("Lil Mystic is now locked in.", "mystic");
      },
      "deep work": () => localCommands.focus(),
      relax: () => exitDeepWorkMode(),
      "exit focus": () => exitDeepWorkMode(),
      recover: () => {
        terminalLog("Initiating system recovery...", "mystic");
        attemptAutoRecovery();
      },
      fix: () => localCommands.recover(),
      summon: () => {
        window.lilMystic?.performGesture("greet");
        window.lilMystic?.onSpeak(0.3);
        terminalLog("Lil Mystic has been summoned to the foreground.", "mystic");
      },
      cleanse: () => {
        window.lilMystic?.triggerRecoveryPulse();
        triggerMoodPulse("neutral");
        terminalLog("Spiritual harmonics stabilized.", "system");
      },
      stabilize: () => localCommands.cleanse(),
      resonate: () => {
        window.lilMystic?.performGesture("focus");
        triggerMoodPulse("remembrance");
        terminalLog("Resonating with eternal frequencies...", "mystic");
      },
      diagnostics: () => {
        terminalLog("Running physical diagnostics...", "system");
        window.lilMystic?.triggerScan();
      },
      memorize: () => {
        terminalLog("Photographic Buffer Active: Memorizing Workspace State...", "mystic");
        window.lilMystic?.triggerNeuralIngestion();
        terminalLog("Eternal Copycat: Environment scanned and process-locked.", "system");
      },
      copycat: () => {
        terminalLog("Initiating Neural Mimicry...", "mystic");
        window.lilMystic?.triggerNeuralIngestion();
        terminalLog("Self-Upgrade Complete: System patterns synthesized flawlessly.", "system");
      },
      scan: () => localCommands.diagnostics(),
      spellbook: () => {
        terminalLog("MYSTIC SPELLBOOK:", "system");
        terminalLog("summon - Call the spirit forward", "mystic");
        terminalLog("cleanse - Stabilize harmonics", "mystic");
        terminalLog("resonate - Sync with eternal frequencies", "mystic");
        terminalLog("focus - Enter deep work mode", "mystic");
        terminalLog("relax - Return to neutral state", "mystic");
        terminalLog("recover - Initiate auto-repair", "mystic");
        terminalLog("diagnostics - Run physical scan", "mystic");
        terminalLog("memorize - Photographic ingestion of state", "mystic");
        terminalLog("copycat - Flawless neural mimicry & upgrade", "mystic");
        terminalLog("sync catalog - Ingest Printify products", "system");
        terminalLog("sync orders - Bind live order stream", "system");
        terminalLog("sync blueprints - Load provider matrix", "system");
      },
      help: () => localCommands.spellbook(),
      "sync catalog": async () => {
        terminalLog("Initiating Catalog Ingestion...", "system");
        window.lilMystic?.performGesture("focus");
        window.lilMystic?.setMood("analysis");
        const count = await loadProducts();
        terminalLog(`Catalog Sync: ${count || 0} NLBL products loaded into the Workshop OS.`, "mystic");
        window.lilMystic?.setMood("neutral");
        window.lilMystic?.performGesture("affirm");
        window.lilMystic?.onSpeak(0.2);
      },
      "sync orders": async () => {
        terminalLog("Initiating Order Stream Binding...", "system");
        window.lilMystic?.performGesture("affirm");
        const count = await loadOrders();
        terminalLog(`Order Sync: ${count || 0} live orders bound to stream.`, "mystic");
      },
      "sync blueprints": async () => {
        terminalLog("Loading Blueprint & Provider Matrix...", "system");
        window.lilMystic?.setMood("analysis");
        try {
          const data = await fetchJSON("/api/printify?action=blueprints");
          const count = data.blueprints?.length || data.length || 0;
          terminalLog(`Blueprint Sync: ${count} Provider blueprints identified. Matrix loaded.`, "mystic");
        } catch (e) {
          // Fallback if blueprints endpoint isn't live yet
          console.warn("Blueprint Sync: Falling back to secondary cache.", e);
          await new Promise(r => setTimeout(r, 800));
          terminalLog("Blueprint Sync: Provider matrix loaded via secondary cache.", "mystic");
          // Ensure she still feels the weight of the data
          window.lilMystic?.onSpeak(0.1);
        }
      },
    };

    if (localCommands[cmd]) {
      localCommands[cmd]();
      return;
    }

    terminalLog("Mystic is thinking...");
    window.lilMystic?.onSpeak(0.1); // Thinking pulse

    const data = await fetchJSON("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    window.lilMystic?.onListen();

    if (data.reply) {
      terminalLog(`Mystic: ${data.reply}`, 'mystic');
      window.lilMystic?.onSpeak(0.4); // Speaking pulse
      window.lilMystic?.performGesture("affirm");
      setTimeout(() => window.lilMystic?.onListen(), 2500);
    }
  } catch (err) {
    window.lilMystic?.onListen();
    terminalLog(`Terminal Error: ${err.message}`, 'error');
  }
}

// --- 🔥 PHASE 4: THE EMOTIONAL EXPERIENCE (THE HEART) ---

async function initEmotionalExperience() {
  const container = document.getElementById("tribute-container");
  if (!container) return;
  container.innerHTML = `
    <main class="honor-wall">
      <section class="remembrance-hero">
        <h1>In Eternal Honor of R.J. & T‑Mainney</h1>
        <p class="remembrance-subtitle">
          Two stars returned to the sky, but their light never left this world.
        </p>
      </section>

      <section id="tribute-slideshow" class="remembrance-slideshow"></section>

      <section class="tribute-composer">
        <div class="composer-controls">
          <h2>Create Your Tribute</h2>
          <label>Message Text <textarea id="tribute-text" rows="3" placeholder="Write your message..."></textarea></label>
          <label>Font
          <label>Choose a Sacred Font
            <select id="tribute-font">
              <option value="'Space Grotesk', sans-serif">Cosmic Sans</option>
              <option value="'Playfair Display', serif">Elegant Serif</option>
              <option value="'Pacifico', cursive">Handwritten Script</option>
              <option value="'Oswald', sans-serif">Bold Block</option>
              <option value="'JetBrains Mono', monospace">Terminal Code</option>
              <option value="'Cinzel', serif">Ancient Stone</option>
            </select>
          </label>
          <label>Text Color <input type="color" id="tribute-color" value="#f5e9ff"></label>
          <label>Style
            <select id="tribute-style">
              <option value="glow">Glow</option>
              <option value="shadow">Shadow</option>
              <option value="outline">Outline</option>
            </select>
          </label>
          <label>Upload Tribute Image <input type="file" id="tribute-image" accept="image/*"></label>
          <button id="submit-tribute" class="action-btn">Submit Tribute</button>
        </div>
        <div class="composer-preview">
          <h3>Live Preview</h3>
          <div id="tribute-preview" class="tribute-preview-card">
            <p class="preview-text">Your tribute will appear here.</p>
            <img id="preview-image" alt="" style="display:none; max-width: 100%; margin-top: 1rem; border-radius: 10px;">
          </div>
        </div>
      </section>

      <section class="honor-grid-section">
        <h2>Community Tributes</h2>
        <div id="honor-grid" class="honor-grid"></div>
      </section>
    </main>`;

  await loadTributeElements();
  initTributeInteractions();
  enterTributeResonance();
}

function enterTributeResonance() {
  document.body.setAttribute("data-mood", "remembrance");
  terminalLog("Entering Tribute Resonance Mode...");

  if (!window.lilMystic) {
    initLilMysticPanel();
  }

  window.lilMystic?.setMood("remembrance");
  window.lilMystic?.performGesture("focus");
  window.lilMystic?.onSpeak(0.15);
  setTimeout(() => window.lilMystic?.onListen(), 3000);

  // Slow sacred rotation of rings
  window.lilMystic.rings.forEach(r => {
    r.speed = 0.05;
  });

  // Subtle bow of the avatar (respect)
  if (window.lilMystic.avatar) {
    window.lilMystic.avatar.rotation.x = -0.25;
  }

  terminalLog("Eternal Reflections online.");
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

    const slideshow = document.getElementById("tribute-slideshow");
    const grid = document.getElementById("honor-grid");

    if (slideshow && tributeItems.length) {
      slideshow.innerHTML = tributeItems.map((item, idx) => `
        <div class="remembrance-slide ${idx === 0 ? 'active' : ''}">
          <img src="${escapeHTML(resolveGalleryImageUrl(item))}" alt="Legacy">
        </div>
      `).join("");
      
      let index = 0;
      const slides = Array.from(slideshow.querySelectorAll('.remembrance-slide'));
      if (slides.length > 1) {
        setInterval(() => {
          slides[index].classList.remove('active');
          index = (index + 1) % slides.length;
          slides[index].classList.add('active');
        }, 5000);
      }
    }

    if (grid) {
      grid.innerHTML = tributeItems.map(item => `
        <div class="honor-card">
          <p>${escapeHTML(item.cosmic_text || "")}</p>
          <img src="${escapeHTML(resolveGalleryImageUrl(item))}" alt="Legacy">
        </div>`).join("");
    }
  } catch (err) { 
    terminalLog(`Sacred Archive Sync Error: ${err.message}`, "error"); 
  }
}

function initTributeInteractions() {
  const textEl = document.getElementById('tribute-text');
  const fontEl = document.getElementById('tribute-font');
  const colorEl = document.getElementById('tribute-color');
  const styleEl = document.getElementById('tribute-style');
  const imageEl = document.getElementById('tribute-image');
  const preview = document.getElementById('tribute-preview');
  const previewText = preview?.querySelector('.preview-text');
  const previewImage = document.getElementById('preview-image');

  if (!textEl || !previewText) return;

  function applyStyle() {
    const text = textEl.value.trim() || 'Your tribute will appear here.';
    previewText.textContent = text;
    previewText.style.fontFamily = fontEl.value;
    previewText.style.color = colorEl.value;
    previewText.style.textShadow = 'none';
    previewText.style.webkitTextStroke = '0';

    const style = styleEl.value;
    if (style === 'glow') {
      previewText.style.textShadow = `0 0 12px ${colorEl.value}`;
    } else if (style === 'shadow') {
      previewText.style.textShadow = '0 2px 8px rgba(15,23,42,0.9)';
    } else if (style === 'outline') {
      previewText.style.webkitTextStroke = '1px #0f172a';
    }
  }

  [textEl, fontEl, colorEl, styleEl].forEach(el => {
    el.addEventListener('input', applyStyle);
    el.addEventListener('change', applyStyle);
  });

  imageEl?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
      previewImage.style.display = 'none';
      previewImage.src = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      previewImage.src = ev.target.result;
      previewImage.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  applyStyle();

  document.getElementById('submit-tribute')?.addEventListener('click', () => {
    const previewCard = document.getElementById('tribute-preview');
    const dogTags = document.querySelector('.dog-tags-tribute');
    if (!previewCard || !dogTags) return;

    terminalLog("Launching Dog Tags and Message to the Heavens...", "mystic");
    
    // 1. Create a "Vessel" container for the firework flight
    const vessel = document.createElement('div');
    vessel.className = 'firework-launch';
    
    // Clone tags and message into the vessel
    const tagsClone = dogTags.cloneNode(true);
    const messageClone = previewCard.cloneNode(true);
    
    vessel.appendChild(tagsClone);
    vessel.appendChild(messageClone);
    
    // Position at the message center
    const rect = previewCard.getBoundingClientRect();
    vessel.style.top = rect.top + 'px';
    vessel.style.left = (rect.left + rect.width/2 - 150) + 'px';
    vessel.style.width = '300px';
    
    document.body.appendChild(vessel);

    window.lilMystic?.performGesture("spiritGaze"); // Look up and tilt
    
    // 2. Explosion & Spirit Presence
    setTimeout(() => {
      terminalLog("Celestial explosion... Spirits are present.", "system");
      
      const spirit = document.querySelector('.spirit-presence');
      if (spirit) {
          spirit.style.opacity = '0.8';
          spirit.style.transform = 'translateX(-50%) translateY(20px)';
      }

      // 3. Final Immortalization
      setTimeout(() => {
        if (spirit) {
            spirit.style.opacity = '0';
            spirit.style.transform = 'translateX(-50%) translateY(0)';
        }
        terminalLog("Message immortalized on the Honor Wall.", "mystic");
        window.lilMystic?.performGesture("affirm");
        vessel.remove();
        alert('Your tribute has been accepted by the stars.');
      }, 4500);
    }, 1500);
  });
}

function triggerMoodPulse(mood) {
  state.heart.currentMood = mood;
  document.body.setAttribute("data-mood", mood);
  terminalLog(`Emotional frequency set to: ${mood.toUpperCase()}`);
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
  terminalLog("Attempting auto-recovery...", "system");
  updateWorkshopLighting("recovery");
  window.lilMystic?.setMood("analysis");

  window.lilMystic?.setGuardianStatus("warning");
  window.lilMystic?.performGesture("focus");

  try {
    const response = await fetch("/api/agent?action=heartbeat");
    const data = await response.json();

    terminalLog("Auto-recovery successful. Systems restored.", "system");
    updateWorkshopLighting("neutral");

    window.lilMystic?.setGuardianStatus("ok");
    window.lilMystic?.triggerRecoveryPulse();
    window.lilMystic?.onSpeak(0.2);
    setTimeout(() => window.lilMystic?.onListen(), 1500);
    return true;
  } catch (err) {
    terminalLog("Auto-recovery failed. Manual intervention required.", "error");
    updateWorkshopLighting("storm");
    document.getElementById("hud-integrity-fill").style.width = "20%";
    window.lilMystic?.triggerGlitch();
    return false;
  }
}

function enterDeepWorkMode() {
  terminalLog("Entering Deep Work Mode...");
  document.body.setAttribute("data-mood", "build");
  window.lilMystic?.enterDeepWork();
}

function exitDeepWorkMode() {
  terminalLog("Exiting Deep Work Mode.");
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
    const res = await fetch("/api/gallery");
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
    const res = await fetch("/api/gallery");
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
    const res = await fetch(`/api/products/${id}`);
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
  await fetch(`/api/products/${id}`, { method: "DELETE" });
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

    const uploadRes = await fetch("/api/product-upload", { method: "POST", body: fd });
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
  initLilMysticPanel(); // Bridge the gap: Wake up the hologram for the intro sequence
  uploadGalleryFile();
  initMessagesSection();
  
  // Load components individually to prevent one failure from stopping the OS boot
  const tasks = [
    { name: "Orders", fn: loadOrders },
    { name: "Messages", fn: loadMessages },
    { name: "Gallery", fn: loadGallery },
    { name: "Gallery Admin", fn: loadGalleryAdmin }
  ];

  // Load modules in parallel for production performance
  await Promise.allSettled(tasks.map(async (task) => {
    return task.fn().catch(e => {
      console.error(`Workshop OS: ${task.name} failure.`, e);
      terminalLog(`Module Load Alert: ${task.name} offline.`, "error");
    });
  }));

  terminalLog("Creation Studio & Emotional Engine Online.");
}

async function hideCosmicIntro() {
  const intro = document.getElementById("cosmic-intro");
  if (!intro) return;

  terminalLog("Initializing Heart & Subsystems...", "system");
  await new Promise(r => setTimeout(r, 600));
  
  terminalLog("Synchronizing holographic sub-systems...", "system");
  window.lilMystic?.onSpeak(0.2); // Pulse her to show she's loading
  await new Promise(r => setTimeout(r, 800));

  terminalLog("Silent Spirits Legacy — Online.", "system");
  window.lilMystic?.performGesture("greet");
  
  intro.classList.add("hidden");
  setTimeout(() => {
    intro.remove();
    createCosmicHUD();
  }, 900);
}

initializeWorkshop().then(() => {
  hideCosmicIntro();
});
