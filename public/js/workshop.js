(function () {
  const state = {
    activePanel: "overview",
    products: []
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

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

  async function verifyAccess() {
    try {
      const data = await fetchJSON("/api/auth?action=verify");
      if (!data.authenticated) {
        window.location.href = "/workshop-login.html";
        return false;
      }
      return true;
    } catch {
      window.location.href = "/workshop-login.html";
      return false;
    }
  }

  function switchPanel(panel) {
    state.activePanel = panel;

    $$(".panel").forEach((el) => {
      el.classList.toggle("active", el.id === `panel-${panel}`);
    });

    $$(".nav-item").forEach((button) => {
      button.classList.toggle("active", button.dataset.panel === panel);
    });
  }

  function formatProduct(product) {
    const price = product.displayPrice
      ? `$${Number(product.displayPrice).toFixed(2)}`
      : product.variants?.[0]?.price
        ? `$${(Number(product.variants[0].price) / 100).toFixed(2)}`
        : "No price";

    return `
      <article class="workshop-product-card">
        <div>
          <strong>${escapeHTML(product.title || product.name || "Untitled product")}</strong>
          <span>${escapeHTML(product.id || "No id")}</span>
        </div>
        <small>${price}</small>
      </article>
    `;
  }

  async function loadWorkshopProducts() {
    const summary = $("#workshopProductsSummary") || $("#workshop-products");
    const list = $("#workshopProductsList") || $("#workshop-products");
    if (!summary || !list) return;

    summary.textContent = "Loading products...";
    try {
      const data = await fetchJSON("/api/shop?action=list");
      state.products = Array.isArray(data.products) ? data.products : [];
      summary.textContent = `${state.products.length} products loaded`;
      list.innerHTML = state.products.slice(0, 60).map(formatProduct).join("");
    } catch (error) {
      summary.textContent = "Unable to load products";
      list.innerHTML = `<p class="workshop-error">${escapeHTML(error.message)}</p>`;
    }
  }

  async function loadHealth() {
    const el = $("#healthStatus");
    if (!el) return;

    try {
      const data = await fetchJSON("/api/agent?action=heartbeat");
      el.textContent = data.success && data.status === "ok" ? "Online" : "Needs attention";
    } catch {
      el.textContent = "Offline";
    }
  }

  async function loadLogs() {
    const routineEl = $("#routineLogs") || $("#routine-logs");
    const auditEl = $("#auditLogs") || $("#audit-output");
    if (!routineEl && !auditEl) return;

    try {
      const data = await fetchJSON("/api/logs?action=routine&limit=10");
      const logs = Array.isArray(data.logs) ? data.logs : [];
      if (routineEl) {
        routineEl.textContent = logs.length ? JSON.stringify(logs, null, 2) : "No routine logs yet.";
      }
      const routineCount = $("#routineCount");
      if (routineCount) routineCount.textContent = String(logs.length);
    } catch (error) {
      if (routineEl) routineEl.textContent = `Logs unavailable: ${error.message}`;
      const routineCount = $("#routineCount");
      if (routineCount) routineCount.textContent = "0";
    }

    try {
      const data = await fetchJSON("/api/logs?action=audit&limit=10");
      const logs = Array.isArray(data.logs) ? data.logs : [];
      if (auditEl) {
        auditEl.textContent = logs.length ? JSON.stringify(logs, null, 2) : "No audit logs yet.";
      }
      const auditCount = $("#auditCount");
      if (auditCount) auditCount.textContent = String(logs.length);
    } catch (error) {
      if (auditEl) auditEl.textContent = `Audit logs unavailable: ${error.message}`;
      const auditCount = $("#auditCount");
      if (auditCount) auditCount.textContent = "0";
    }
  }

  function appendAgentMessage(text, who = "assistant") {
    const privateOutput = $("#agentOutput");
    const mysticOutput = $("#mystic-chat-log");
    const output = privateOutput || mysticOutput;
    if (!output) return;

    const message = document.createElement("p");
    message.className = who === "user" ? "agent-message user" : "agent-message assistant";
    message.textContent = text;
    output.appendChild(message);
    output.scrollTop = output.scrollHeight;
  }

  async function sendAgentMessage(message, toolHint) {
    const status = $("#mystic-status");
    if (status) status.textContent = "Thinking...";
    appendAgentMessage(message, "user");

    try {
      const data = await fetchJSON("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          toolHint,
          context: { source: "private-workshop", ts: Date.now() }
        })
      });

      if (Array.isArray(data.messages)) {
        data.messages.forEach((line) => appendAgentMessage(line));
      } else {
        appendAgentMessage(data.reply || "Done.");
      }

      if (Array.isArray(data.actionsRun) && data.actionsRun.length) {
        await Promise.allSettled([loadWorkshopProducts(), loadLogs(), loadHealth()]);
      }
    } catch (error) {
      appendAgentMessage(`I could not complete that: ${error.message}`);
    } finally {
      if (status) status.textContent = "Idle";
    }
  }

  function bindAgentForms() {
    const privateForm = $("#agentForm");
    const privateInput = $("#agentPrompt");
    if (privateForm && privateInput) {
      privateForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const message = privateInput.value.trim();
        if (!message) return;
        privateInput.value = "";
        sendAgentMessage(message);
      });
    }

    const mysticInput = $("#mystic-input");
    const mysticSend = $("#mystic-send");
    if (mysticInput && mysticSend) {
      mysticSend.addEventListener("click", () => {
        const message = mysticInput.value.trim();
        if (!message) return;
        mysticInput.value = "";
        sendAgentMessage(message);
      });

      mysticInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") mysticSend.click();
      });
    }
  }

  function bindTools() {
    const toolHints = {
      "sync-catalog": "sync",
      "cleanup-gibberish": "cleanup",
      "generate-new": "generate",
      "audit-site": "audit",
      "test-endpoints": "test"
    };

    $$(".workshop-tool-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const label = button.textContent.trim();
        sendAgentMessage(`Run tool: ${label}`, toolHints[button.dataset.tool] || button.dataset.tool);
      });
    });
  }

  function bindNavigation() {
    $$(".nav-item").forEach((button) => {
      button.addEventListener("click", () => switchPanel(button.dataset.panel));
    });

    const logout = $("#logoutBtn");
    if (logout) {
      logout.addEventListener("click", async () => {
        await fetch("/api/auth", { method: "DELETE" }).catch(() => {});
        window.location.href = "/workshop-login.html";
      });
    }
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // --- PHASE 1: COSMIC ENVIRONMENT ---

  function initStarfield() {
    const canvas = document.getElementById("starfield");
    if (!canvas) return;
    // starfield.js already handles this; but we ensure it's initialized
    // The existing starfield.js script will run automatically on load.
  }

  function initParallaxLayers() {
    const nebula = document.querySelector(".nebula-layer");
    const fog = document.querySelector(".fog-layer");
    if (!nebula || !fog) return;

    document.addEventListener("pointermove", (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      nebula.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.06)`;
      fog.style.transform = `translate3d(${-x * 0.6}px, ${-y * 0.6}px, 0) scale(1.04)`;
    });
  }

  function initAmbience() {
    const audio = document.getElementById("cosmic-ambience");
    if (!audio) return;
    audio.volume = 0.35;
  }

  // --- PHASE 5: SYSTEM INTELLIGENCE (HUD + BRAIN) ---

  async function heartbeat() {
    const statusEl = document.getElementById("system-status");
    const telemetry = document.getElementById("telemetry-strip");
    try {
      const res = await fetch("/api/agent?action=heartbeat");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (statusEl) {
        statusEl.textContent = "SYSTEMS NOMINAL";
        statusEl.style.borderColor = "rgba(79, 255, 176, 0.7)";
        statusEl.style.color = "#4fffb0";
      }

      if (telemetry) {
        telemetry.textContent =
          `ENGINE: ONLINE • DB: ${data.db || "UNKNOWN"} • PRINTIFY: ${data.printify || "UNKNOWN"} • DISCORD: ${data.discord || "UNKNOWN"}`;
      }

      terminalLog?.("Heartbeat OK. Systems nominal.", "system");
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = "ENGINE FAULT";
        statusEl.style.borderColor = "rgba(255, 79, 122, 0.8)";
        statusEl.style.color = "#ff4f7a";
      }
      if (telemetry) {
        telemetry.textContent = "ENGINE: FAULT • DB: UNKNOWN • PRINTIFY: UNKNOWN • DISCORD: UNKNOWN";
      }
      terminalLog?.(`Heartbeat failed: ${err.message}`, "error");
      // Optional: trigger mood shift on fault
      triggerMoodPulse?.("remembrance");
    }
  }

  async function initPipelineAutoRefresh() {
    await refreshPipeline?.();
    setInterval(() => {
      refreshPipeline?.();
    }, 30000);
  }

  async function runRoutineCommand(cmd) {
    try {
      const res = await fetch(`/api/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: cmd }),
      });
      const data = await res.json();
      if (data.reply) {
        terminalLog?.(`Mystic: ${data.reply}`, "mystic");
      }
    } catch (err) {
      terminalLog?.(`Routine error: ${err.message}`, "error");
    }
  }

  // --- BOOTSTRAP FUSION ---

  async function bootWorkshop() {
    // Start cosmic environment
    initStarfield();
    initParallaxLayers();
    initAmbience();

    // Call existing initialization (if defined)
    if (typeof initializeWorkshop === "function") {
      await initializeWorkshop();
    }

    // Bring up system systems
    initTerminal?.();
    initPipelineAutoRefresh();
    heartbeat();
    setInterval(heartbeat, 45000);

    terminalLog?.("Creation Studio, Hologram, and Heart fused with System Intelligence.", "system");
  }

  // --- EXISTING CODE BASE (renamed init -> initializeWorkshop) ---

  async function initializeWorkshop() {
    const hasPrivateShell = $(".workshop-shell");
    if (!hasPrivateShell) return;

    const allowed = await verifyAccess();
    if (!allowed) return;

    bindNavigation();
    bindAgentForms();
    bindTools();
    switchPanel(state.activePanel);

    await Promise.allSettled([loadHealth(), loadWorkshopProducts(), loadLogs()]);

    window.NLBL = window.NLBL || {};
    window.NLBL.loadWorkshopProducts = loadWorkshopProducts;
    window.NLBL.loadLogs = loadLogs;
    window.NLBL.sendAgentMessage = sendAgentMessage;
    window.NLBL.lilMysticNotify = (message) => appendAgentMessage(message);
  }

  document.addEventListener("DOMContentLoaded", bootWorkshop);
})();
