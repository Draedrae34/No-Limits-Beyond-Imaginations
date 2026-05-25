(function () {
  const textEl = document.getElementById("tribute-text");
  const fontEl = document.getElementById("tribute-font");
  const colorEl = document.getElementById("tribute-color");
  const styleEl = document.getElementById("tribute-style");
  const imageEl = document.getElementById("tribute-image");
  const preview = document.getElementById("tribute-preview");
  const previewText = preview?.querySelector(".preview-text");
  const previewImage = document.getElementById("preview-image");
  const submitBtn = document.getElementById("submit-tribute");
  const honorGrid = document.getElementById("honor-grid");

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

  function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  function applyStyle() {
    if (!textEl || !fontEl || !colorEl || !styleEl || !previewText) return;

    const text = textEl.value.trim() || "Your tribute will appear here.";
    previewText.textContent = text;
    previewText.style.fontFamily = fontEl.value;
    previewText.style.color = colorEl.value;
    previewText.style.textShadow = "none";
    previewText.style.webkitTextStroke = "0";

    if (styleEl.value === "glow") {
      previewText.style.textShadow = `0 0 14px ${colorEl.value}`;
    } else if (styleEl.value === "shadow") {
      previewText.style.textShadow = "0 2px 12px rgba(0,0,0,0.95)";
    } else if (styleEl.value === "outline") {
      previewText.style.webkitTextStroke = `1px ${colorEl.value}`;
      previewText.style.color = "transparent";
    }
  }

  function renderMessages(messages) {
    if (!honorGrid) return;

    if (!messages.length) {
      honorGrid.innerHTML = `
        <div class="honor-card honor-card-empty">
          <p>No public tributes are showing yet. Be the first to leave a message.</p>
        </div>
      `;
      return;
    }

    honorGrid.innerHTML = messages.map((msg) => {
      const font = msg.font || "'Space Grotesk', sans-serif";
      const color = msg.color || "#f5e9ff";
      return `
        <article class="honor-card">
          <p style="font-family:${escapeHTML(font)}; color:${escapeHTML(color)};">${escapeHTML(msg.message)}</p>
          <small>${escapeHTML(msg.name || "Anonymous")} • ${new Date(msg.created_at).toLocaleDateString()}</small>
        </article>
      `;
    }).join("");
  }

  async function loadTributes() {
    if (!honorGrid) return;

    honorGrid.innerHTML = `
      <div class="honor-card honor-card-empty">
        <p>Loading community tributes...</p>
      </div>
    `;

    try {
      const data = await fetchJSON("/api/messages?action=list&filter=approved");
      renderMessages(data.messages || []);
    } catch (err) {
      console.error("Unable to load tributes:", err);
      honorGrid.innerHTML = `
        <div class="honor-card honor-card-empty">
          <p>The tribute wall could not load right now. Please refresh in a moment.</p>
        </div>
      `;
    }
  }

  function wirePreview() {
    if (!textEl || !fontEl || !colorEl || !styleEl || !previewText) return;

    [textEl, fontEl, colorEl, styleEl].forEach((el) => {
      el.addEventListener("input", applyStyle);
      el.addEventListener("change", applyStyle);
    });

    imageEl?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (!file || !previewImage) {
        if (previewImage) {
          previewImage.style.display = "none";
          previewImage.src = "";
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        previewImage.src = loadEvent.target.result;
        previewImage.style.display = "block";
      };
      reader.readAsDataURL(file);
    });

    applyStyle();
  }

  function wireSubmit() {
    if (!submitBtn || !textEl || !fontEl || !colorEl) return;

    submitBtn.addEventListener("click", async () => {
      const message = textEl.value.trim();
      if (!message) {
        alert("Please write a message for your tribute.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      try {
        await fetchJSON("/api/messages?action=add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Legacy Visitor",
            message,
            font: fontEl.value,
            color: colorEl.value,
          }),
        });

        textEl.value = "";
        if (previewImage) {
          previewImage.style.display = "none";
          previewImage.src = "";
        }
        applyStyle();
        alert("Your tribute was received. It will appear after approval.");
      } catch (err) {
        console.error("Tribute submission failed:", err);
        alert("The tribute could not be sent right now. Please try again.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send to the Stars";
      }
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    wirePreview();
    wireSubmit();
    loadTributes();
  });
})();
