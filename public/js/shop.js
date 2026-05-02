const API_URL = "/api/shop";

console.log("🛒 shop.js: Script loaded, API_URL:", API_URL);

let fullCatalog = [];
let filteredCatalog = [];
let cartCount = 0;
let activeCategory = "All";

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

  const defaultImage = (product.images || []).find(img => img.is_default) || product.images?.[0];
  const imageSrc = defaultImage?.src || "";

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
      <button class="product-add-btn" type="button">Add to Cart</button>
    </div>
  `;

  // Card click → open modal (except Add to Cart button)
  card.addEventListener("click", e => {
    if (e.target.closest(".product-add-btn")) return;
    openModal(product);
  });

  // Add to cart button
  const addBtn = card.querySelector(".product-add-btn");
  addBtn.addEventListener("click", e => {
    e.stopPropagation();
    handleAddToCart(card, product);
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

/* Add to Cart */

function handleAddToCart(card, product) {
  cartCount += 1;
  cartCountEl.textContent = cartCount.toString();

  card.classList.remove("card-pulse");
  void card.offsetWidth;
  card.classList.add("card-pulse");

  floatingCartBtn.classList.remove("cart-pulse");
  void floatingCartBtn.offsetWidth;
  floatingCartBtn.classList.add("cart-pulse");

  // Hook into your real cart/payment processor later
}

/* Modal */

function openModal(product) {
  modalProduct = product;
  const defaultImage = (product.images || []).find(img => img.is_default) || product.images?.[0];
  const imageSrc = defaultImage?.src || "";

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
  handleAddToCart(document.querySelector(`.product-card[data-product-id="${modalProduct.id}"]`) || modalBackdrop, modalProduct);
});

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
