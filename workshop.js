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

// ... (rest of the file continues with the same content as before)