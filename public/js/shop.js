const API_URL = "/api/shop";

console.log("🛒 shop.js: Script loaded, API_URL:", API_URL);

let fullCatalog = [];
let filteredCatalog = [];
let cartCount = 0;
let activeCategory = "All";
let currentPaypalProduct = null;

const gridEl = document.getElementById("shop-grid");
const categoryFiltersEl = document.getElementById("category-filters");
const searchInputEl = document.getElementById("product-search");
const memorialToggleBtn = document.getElementById("memorial-mode-toggle");
const memorialLabelEl = document.getElementById("memorial-mode-label");
const floatingCartBtn = document.getElementById("floating-cart");
const cartCountEl = document.getElementById("cart-count");

// Modal elements
const modalBackdrop = document.getElementById("product-modal");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalImageEl = document.getElementById("modal-image");
const modalTitleEl = document.getElementById("modal-title");
const modalDescriptionEl = document.getElementById("modal-description");
const modalTagsEl = document.getElementById("modal-tags");
const modalPriceEl = document.getElementById("modal-price");
const modalAddBtn = document.getElementById("modal-add-to-cart");
const paypalPanel = document.getElementById("paypal-checkout-panel");
const paypalCloseBtn = document.getElementById("paypal-close");
const paypalTitleEl = document.getElementById("paypal-product-title");
const paypalStatusEl = document.getElementById("paypal-checkout-status");
const paypalButtonContainer = document.getElementById("paypal-button-container");

let modalProduct = null;

// Smooth scroll from hero button
document.querySelectorAll("[data-scroll-target]").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-scroll-target");
    const el = document.querySelector(target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// Fetch catalog
async function loadCatalog() {
  try {
    console.log("🛒 shop.js: Starting catalog load...");
    const res = await fetch(API_URL);
    console.log("🛒 shop.js: API response status:", res.status);
    const data = await res.json();
    console.log("🛒 shop.js: API response data:", data);
    console.log("🛒 shop.js: Data keys:", Object.keys(data));
    console.log("🛒 shop.js: data.products type:", typeof data.products, "length:", Array.isArray(data.products) ? data.products.length : 'not array');

    // Unified shop returns { products: [...] }
    fullCatalog = Array.isArray(data.products) ? data.products : [];
    console.log("🛒 shop.js: Catalog loaded, count:", fullCatalog.length);

    filteredCatalog = [...fullCatalog];

    buildCategoryFilters();
    renderGrid();
    setupScrollAnimations();
  } catch (err) {
    console.error("❌ shop.js: Error loading catalog:", err);
    gridEl.innerHTML = `<p style="color:#f97373;">Unable to load products. Please try again later.</p>`;
  }
}

function buildCategoryFilters() {
  const categories = new Set(["All"]);
  fullCatalog.forEach(p => {
    if (Array.isArray(p.tags)) {
      p.tags.forEach(tag => {
        if (typeof tag === "string" && tag.trim()) {
          categories.add(tag.trim());
        }
      });
    }
  });

  categoryFiltersEl.innerHTML = "";
  categories.forEach(cat => {
    const pill = document.createElement("button");
    pill.className = "filter-pill" + (cat === "All" ? " active" : "");
    pill.textContent = cat;
    pill.dataset.category = cat;
    pill.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      activeCategory = cat;
      applyFilters();
    });
    categoryFiltersEl.appendChild(pill);
  });
}

function applyFilters() {
  const query = searchInputEl.value.trim().toLowerCase();

  filteredCatalog = fullCatalog.filter(p => {
    const matchesCategory =
      activeCategory === "All" ||
      (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase() === activeCategory.toLowerCase()));

    const matchesSearch =
      !query ||
      (p.title && p.title.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  renderGrid();
}

searchInputEl.addEventListener("input", () => {
  applyFilters();
});

function renderGrid() {
  console.log("🛒 shop.js: renderGrid called, filteredCatalog length:", filteredCatalog.length);
  gridEl.innerHTML = "";

  if (filteredCatalog.length === 0) {
    gridEl.innerHTML = `
      <div class="shop-empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <p style="font-size: 1.2rem; color: #a78bfa; margin-bottom: 10px;">No products found in this part of the cosmos.</p>
        <p style="color: #6b7280;">Try adjusting your search or filters.</p>
      </div>
    `;
    return;
  }

  filteredCatalog.forEach(product => {
    const card = createProductCard(product);
    gridEl.appendChild(card);
  });
}

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card fade-in-up";
  card.dataset.productId = product.id;

  // Handle both image formats: array of strings OR array of objects with src
  let imageSrc = "";
  if (Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];
    imageSrc = typeof firstImage === 'string' ? firstImage : (firstImage.src || "");
  }

  const minPrice = getMinPrice(product);

  const primaryTag = Array.isArray(product.tags) && product.tags.length ? product.tags[0] : "Featured";

  const featuredBadge = product.featured
    ? `<div class="featured-badge" style="position:absolute;top:10px;left:10px;background:#ff9cfb;color:#050814;padding:4px 10px;border-radius:999px;font-size:0.75rem;font-weight:700;box-shadow:0 0 10px rgba(255,156,251,0.6);">FEATURED</div>`
    : '';

  card.innerHTML = `
    <div class="product-image-wrap">
      ${featuredBadge}
      <img src="${imageSrc}" alt="${escapeHtml(product.title || "")}" loading="lazy" />
    </div>
    <div class="product-meta-row">
      <span class="product-category-pill">${escapeHtml(primaryTag)}</span>
      <span class="product-price">${minPrice}</span>
    </div>
    <h3 class="product-title">${escapeHtml(product.title || "")}</h3>
    <p class="product-description">${escapeHtml(stripHtml(product.description || "").slice(0, 140))}${product.description && product.description.length > 140 ? "…" : ""}</p>
    <div class="product-card-footer">
      <div class="product-tags-inline">
        ${(product.tags || [])
          .slice(0, 3)
          .map(tag => `<span class="product-tag-chip">${escapeHtml(tag)}</span>`)
          .join("")}
      </div>
      <button class="product-add-btn paypal-buy-now-btn" type="button">PayPal</button>
    </div>
  `;

  // Card click -> open modal (except PayPal button)
  card.addEventListener("click", e => {
    if (e.target.closest(".product-add-btn")) return;
    openModal(product);
  });

  // PayPal button
  const addBtn = card.querySelector(".product-add-btn");
  addBtn.addEventListener("click", e => {
    e.stopPropagation();
    initiatePaypalCheckout(product);
  });

  // 3D tilt
  card.addEventListener("mousemove", e => handleTilt(card, e));
  card.addEventListener("mouseleave", () => resetTilt(card));

  return card;
}

function getMinPrice(product) {
  // Use overridden displayPrice if set
  if (product.displayPrice) {
    return `$${Number(product.displayPrice).toFixed(2)}`;
  }
  if (!Array.isArray(product.variants) || !product.variants.length) return "$—";
  const enabled = product.variants.filter(v => v.is_enabled);
  const list = enabled.length ? enabled : product.variants;
  const min = list.reduce((acc, v) => (v.price < acc ? v.price : acc), list[0].price);
  const dollars = (min / 100).toFixed(2);
  return `$${dollars}`;
}

function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* Tilt */

function handleTilt(card, e) {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const rotateX = ((y - centerY) / centerY) * -6;
  const rotateY = ((x - centerX) / centerX) * 6;

  card.style.transform = `translateY(-6px) scale(1.02) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

function resetTilt(card) {
  card.style.transform = "translateY(-6px) scale(1.02)";
}

/* PayPal checkout */

function pulseProduct(card) {
  cartCount += 1;
  cartCountEl.textContent = cartCount.toString();

  if (card) {
    card.classList.remove("card-pulse");
    void card.offsetWidth;
    card.classList.add("card-pulse");
  }

  floatingCartBtn.classList.remove("cart-pulse");
  void floatingCartBtn.offsetWidth;
  floatingCartBtn.classList.add("cart-pulse");
}

function getProductAmount(product) {
  if (product.displayPrice) return Number(product.displayPrice).toFixed(2);
  if (!Array.isArray(product.variants) || !product.variants.length) return "0.00";
  const enabled = product.variants.filter(v => v.is_enabled);
  const list = enabled.length ? enabled : product.variants;
  const min = list.reduce((acc, v) => (v.price < acc.price ? v : acc), list[0]);
  return (Number(min.price || 0) / 100).toFixed(2);
}

function getVariantId(product) {
  if (!Array.isArray(product.variants) || !product.variants.length) return "";
  const enabled = product.variants.find(v => v.is_enabled);
  return String((enabled || product.variants[0]).id || "");
}

async function initiatePaypalCheckout(product) {
  currentPaypalProduct = product;
  pulseProduct(document.querySelector(`.product-card[data-product-id="${product.id}"]`));
  showPaypalPanel(product);

  try {
    await loadPaypalSdk();
    renderPaypalButton(product);
  } catch (error) {
    console.error("PayPal checkout setup failed:", error);
    paypalStatusEl.textContent = "Unable to load PayPal checkout. Please try again later.";
  }
}

function showPaypalPanel(product) {
  if (!paypalPanel || !paypalStatusEl || !paypalButtonContainer) return;
  paypalTitleEl.textContent = product.title || "PayPal Checkout";
  paypalStatusEl.textContent = `Preparing checkout for ${product.title || "this product"}...`;
  paypalButtonContainer.innerHTML = "";
  paypalPanel.classList.remove("hidden");
}

async function loadPaypalSdk() {
  if (window.paypal?.Buttons) return;

  const response = await fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "paypal-client-id" })
  });
  const data = await response.json();
  if (!response.ok || !data.clientId) {
    throw new Error(data.error || "Missing PayPal client ID");
  }

  await new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-paypal-sdk]");
    if (existing) {
      if (window.paypal?.Buttons) {
        resolve();
        return;
      }
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.dataset.paypalSdk = "true";
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(data.clientId)}&currency=USD`;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  await waitForPaypalButtons();
}

function waitForPaypalButtons() {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      if (window.paypal?.Buttons) {
        clearInterval(interval);
        resolve();
        return;
      }

      if (Date.now() - startedAt > 10000) {
        clearInterval(interval);
        reject(new Error("PayPal SDK did not finish initializing"));
      }
    }, 100);
  });
}

function renderPaypalButton(product) {
  if (!window.paypal?.Buttons || !paypalButtonContainer) return;
  const amount = getProductAmount(product);
  paypalButtonContainer.innerHTML = "";
  paypalStatusEl.textContent = `Paying ${amount} for ${product.title || "this product"}.`;

  window.paypal.Buttons({
    commit: true,
    style: {
      layout: "vertical",
      color: "blue",
      shape: "rect",
      label: "pay"
    },
    createOrder: (data, actions) => actions.order.create({
      purchase_units: [{
        amount: { value: amount },
        description: product.title || "NLBL product",
        custom_id: String(product.id)
      }]
    }),
    onApprove: async (data, actions) => {
      paypalStatusEl.textContent = "Capturing payment...";
      const order = await actions.order.capture();
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "paypal-log-order",
          orderID: order.id,
          productID: product.id,
          variantID: getVariantId(product),
          amount
        })
      });
      const result = await response.json();
      paypalStatusEl.textContent = result.success
        ? "Payment successful. Thank you."
        : (result.error || "Payment capture failed. Please try again.");
    },
    onCancel: () => {
      paypalStatusEl.textContent = "Payment cancelled. You can try again anytime.";
    },
    onError: error => {
      console.error("PayPal error:", error);
      paypalStatusEl.textContent = "PayPal checkout failed. Please try again later.";
    }
  }).render("#paypal-button-container");
}

/* Modal */

function openModal(product) {
  modalProduct = product;
  let imageSrc = "";
  if (Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];
    imageSrc = typeof firstImage === 'string' ? firstImage : (firstImage.src || "");
  }

  modalImageEl.src = imageSrc;
  modalImageEl.alt = product.title || "";
  modalTitleEl.textContent = product.title || "";
  modalDescriptionEl.textContent = stripHtml(product.description || "");
  modalPriceEl.textContent = getMinPrice(product);

  modalTagsEl.innerHTML = "";
  (product.tags || []).forEach(tag => {
    const chip = document.createElement("span");
    chip.className = "modal-tag-chip";
    chip.textContent = tag;
    modalTagsEl.appendChild(chip);
  });

  modalBackdrop.classList.remove("hidden");
}

function closeModal() {
  modalBackdrop.classList.add("hidden");
  modalProduct = null;
}

modalCloseBtn.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", e => {
  if (e.target === modalBackdrop) closeModal();
});

modalAddBtn.addEventListener("click", () => {
  if (!modalProduct) return;
  initiatePaypalCheckout(modalProduct);
});

if (paypalCloseBtn) {
  paypalCloseBtn.addEventListener("click", () => {
    paypalPanel.classList.add("hidden");
    paypalStatusEl.textContent = "";
    paypalButtonContainer.innerHTML = "";
    currentPaypalProduct = null;
  });
}

/* Memorial Mode */

memorialToggleBtn.addEventListener("click", () => {
  const isOn = document.body.classList.toggle("memorial-mode");
  memorialLabelEl.textContent = isOn ? "On" : "Off";
});

/* Scroll Animations */

function setupScrollAnimations() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".fade-in-up").forEach(el => observer.observe(el));
}

/* Init */

loadCatalog();
