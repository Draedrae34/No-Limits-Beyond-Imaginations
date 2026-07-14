/**
 * NLBL Shop Loader
 * Primary source: /api/products (Neon)
 * Fallback source: /shop-products.json
 */

class NLBLShopLoader {
  constructor() {
    this.products = [];
    this.cart = [];
    this.currentFilter = "all";
    this.currentPaypalProduct = null;

    this.init();
  }

  async init() {
    await this.loadProducts();
    this.renderCategoryOptions();
    this.renderProducts(this.currentFilter);
    this.setupEventListeners();
  }

  async loadProducts() {
    try {
      // Prefer the unified shop endpoint so Printify catalog and local product data are merged.
      const apiResponse = await fetch("/api/shop?action=list");
      if (!apiResponse.ok) {
        throw new Error("Shop API unavailable");
      }

      const apiData = await apiResponse.json();
      if (!apiData.products || !Array.isArray(apiData.products)) {
        throw new Error("Invalid shop product payload");
      }

      this.products = apiData.products.map((product) => this.normalizeProduct(product));
      return this.products;
    } catch (apiError) {
      console.warn("Shop API load failed, falling back to static source:", apiError);
    }

    // Fallback to static JSON
    try {
      const response = await fetch("/shop-products.json");
      if (!response.ok) {
        throw new Error("Failed to load static products");
      }

      const feed = await response.json();
      const products = Array.isArray(feed) ? feed : (feed.products || []);
      this.products = products
        .map((product) => this.normalizeProduct(product))
        .filter((product) => product.active);
      return this.products;
    } catch (error) {
      console.error("Unable to load products:", error);
      this.products = [];
      this.showError("Failed to load products. Please refresh the page.");
      return [];
    }
  }

  normalizeProduct(product) {
    return {
      id: String(product.id || ""),
      variant_id: product.variants?.[0]?.id || product.variant_id || "",
      name: product.name || product.title || "Unnamed Product",
      description: product.description || "No description available.",
      price: Number(product.price || (product.variants?.[0]?.price / 100) || 0),
      image_url: product.image_url || product.images?.[0]?.src || "/placeholder-product.png",
      category: product.category || "General",
      tags: Array.isArray(product.tags) ? product.tags : [],
      active: product.active !== false
    };
  }

  renderCategoryOptions() {
    const container = document.getElementById("category-filters");
    if (!container) return;

    const categories = [...new Set(this.products.map((product) => product.category).filter(Boolean))].sort();
    const options = ["all", ...categories];

    container.innerHTML = options
      .map((category) => {
        const label = category === "all" ? "All" : category;
        const active = category === this.currentFilter ? " active" : "";
        return `<button class="filter-pill${active}" type="button" data-category="${category}">${label}</button>`;
      })
      .join("");

    container.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        this.currentFilter = button.dataset.category || "all";
        container.querySelectorAll(".filter-pill").forEach((pill) => pill.classList.remove("active"));
        button.classList.add("active");
        this.renderProducts(this.currentFilter);
      });
    });
  }

  updateProductCount(count) {
    const countEl = document.getElementById("product-count");
    if (!countEl) return;
    countEl.style.display = "block";
    countEl.innerHTML = `Showing <span>${count}</span> product${count === 1 ? "" : "s"}`;
  }

  createProductCard(product) {
    const imageUrl = this.getImageUrl(product.image_url);
    const priceDisplay = this.formatPrice(product.price);
    const tagsHtml = product.tags.length
      ? `<div class="product-tags">${product.tags
          .map((tag) => `<span class="product-tag">${tag}</span>`)
          .join("")}</div>`
      : "";

     return `
       <div class="product-card quantum-card fade-in" data-product-id="${product.id}">
         <div class="product-image">
           <img src="${imageUrl}" alt="${product.name}" onerror="this.src='/placeholder-product.png'">
           <div class="product-overlay">
             <button class="quick-view" data-id="${product.id}">Quick View</button>
           </div>
         </div>

         <div class="product-info">
           ${tagsHtml}
           <h3 class="product-name">${product.name}</h3>
           <p class="product-category">${product.category}</p>
           <p class="product-description">${product.description}</p>
           <div class="product-price">${priceDisplay}</div>
           <div class="product-actions">
             <button class="paypal-buy-now-btn" data-id="${product.id}">PayPal</button>
           </div>
         </div>
       </div>
    `;
   }
   
  renderProducts(filter = "all") {
    const container =
      document.querySelector("#shop-grid") ||
      document.querySelector(".products-grid") ||
      document.querySelector("#products-container");
    if (!container) return;

    const filtered = filter === "all" 
      ? this.products 
      : this.products.filter(p => (p.category || "").toLowerCase() === filter.toLowerCase());

    container.innerHTML = filtered.length 
      ? filtered.map(p => this.createProductCard(p)).join("")
      : '<p class="no-products">No products found in this category.</p>';
      
    this.attachCardListeners();
    this.updateProductCount(filtered.length);
  }

  getImageUrl(imagePath) {
    if (!imagePath) return "/placeholder-product.png";
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/")) return imagePath;
    return `/${imagePath}`;
  }

  formatPrice(price) {
    const value = Number(price);
    if (!Number.isFinite(value)) return "$0.00";
    return `$${value.toFixed(2)}`;
  }

  attachCardListeners() {
    document.querySelectorAll(".paypal-buy-now-btn").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this.initiatePaypalCheckout(button.dataset.id);
      });
    });

    document.querySelectorAll(".quick-view").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this.showQuickView(button.dataset.id);
      });
    });
  }

  searchProducts(query) {
    const normalized = query.toLowerCase();
    const filtered = this.products.filter((product) => {
      return (
        product.name.toLowerCase().includes(normalized) ||
        product.description.toLowerCase().includes(normalized) ||
        (product.category || "").toLowerCase().includes(normalized)
      );
    });

    const container =
      document.querySelector("#shop-grid") ||
      document.querySelector(".products-grid") ||
      document.querySelector("#products-container");
    if (!container) return;

    container.innerHTML =
      filtered.length > 0
        ? filtered.map((product) => this.createProductCard(product)).join("")
        : '<p class="no-products">No products match your search.</p>';
    this.attachCardListeners();
    this.updateProductCount(filtered.length);
  }

  setupEventListeners() {
    const categorySelect = document.getElementById("category-select");
    if (categorySelect) {
      categorySelect.addEventListener("change", (event) => {
        this.currentFilter = event.target.value || "all";
        this.renderProducts(this.currentFilter);
      });
    }

    const searchInput = document.getElementById("product-search");
    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        this.searchProducts(event.target.value);
      });
    }
  }

  async initiatePaypalCheckout(productId) {
    await this.showQuickView(productId);
  }

  async showQuickView(productId) {
    const product = this.products.find((item) => String(item.id) === String(productId));
    if (!product) return;

    this.currentPaypalProduct = product;
    this.showPaypalPanel();

    try {
      await this.loadPaypalSdk();
      this.renderPaypalButton();
    } catch (error) {
      console.error(error);
      this.showError("Unable to load PayPal checkout.");
    }
  }

  showPaypalPanel() {
    const panel = document.getElementById("paypal-checkout-panel");
    const status = document.getElementById("paypal-checkout-status");
    const closeButton = document.getElementById("paypal-close");
    if (!panel || !status || !closeButton) return;

    panel.classList.remove("hidden");
    status.textContent = "";

    if (!closeButton.dataset.paypalListenerAttached) {
      closeButton.addEventListener("click", () => {
        panel.classList.add("hidden");
        status.textContent = "";
        const container = document.getElementById("paypal-button-container");
        if (container) {
          container.innerHTML = "";
        }
      });
      closeButton.dataset.paypalListenerAttached = "true";
    }
  }

  async loadPaypalSdk() {
    if (window.paypal) return;

    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "paypal-client-id" })
    });
    const data = await response.json();
    if (!response.ok || !data.clientId) {
      throw new Error(data.error || "Failed to load PayPal configuration");
    }

    // Load the PayPal SDK script
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(data.clientId)}&currency=USD`;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Wait for PayPal to fully initialize
    await this.waitForPayPal();
  }

  waitForPayPal() {
    return new Promise((resolve, reject) => {
      const maxWait = 10000; // 10 second timeout
      const startTime = Date.now();

      const checkInterval = setInterval(() => {
        if (window.paypal && window.paypal.Buttons) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > maxWait) {
          clearInterval(checkInterval);
          reject(new Error("PayPal SDK failed to initialize within timeout"));
        }
      }, 100);
    });
  }

  renderPaypalButton() {
    const product = this.currentPaypalProduct;
    const container = document.getElementById("paypal-button-container");
    const status = document.getElementById("paypal-checkout-status");
    if (!product || !container || !status || !window.paypal) return;

    container.innerHTML = "";
    status.textContent = `Paying for ${product.name}...`;

    window.paypal
      .Buttons({
        commit: true,
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'pay',
        },
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: { value: product.price.toFixed(2) },
                description: product.name,
                custom_id: String(product.id),
              },
            ],
          });
        },
        onApprove: async (data, actions) => {
          status.textContent = "Capturing your payment...";
          const order = await actions.order.capture();

          const response = await fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "paypal-log-order",
              orderID: order.id,
              productID: product.id,
              variantID: product.variant_id,
              amount: product.price,
            }),
          });

          const result = await response.json();
          if (result.success) {
            status.textContent = "Payment successful! Thank you.";
            this.showNotification(`Success: ${product.name} ordered.`);
          } else {
            status.textContent = "Payment capture failed. Please try again.";
            this.showError(result.error || "PayPal payment failed");
          }
        },
        onCancel: () => {
          status.textContent = "Payment cancelled. You can try again anytime.";
        },
        onError: (error) => {
          console.error("PayPal error:", error);
          status.textContent = "PayPal checkout failed. Please try again later.";
          this.showError("PayPal checkout failed.");
        },
      })
      .render("#paypal-button-container");
  }

  showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  showError(message) {
    const error = document.createElement("div");
    error.className = "error-notification";
    error.textContent = message;
    document.body.appendChild(error);
    setTimeout(() => error.remove(), 5000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.shopLoader = new NLBLShopLoader();
});
