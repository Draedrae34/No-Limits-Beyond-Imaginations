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
    this.stripe = null;
    this.stripeKey = null;

    this.init();
  }

  async init() {
    await this.loadProducts();
    await this.loadStripeKey(); // Load Stripe key early
    this.renderCategoryOptions();
    this.renderProducts(this.currentFilter);
    this.setupEventListeners();
  }

  async loadStripeKey() {
    try {
      const response = await fetch("/api/stripe-public-key");
      if (response.ok) {
        const data = await response.json();
        this.stripeKey = data.publishableKey;
        if (this.stripeKey) {
          this.stripe = Stripe(this.stripeKey);
        }
      }
    } catch (error) {
      console.error("Failed to load Stripe key:", error);
    }
  }

  normalizeProduct(raw) {
    // Handle both Printify API format and local fallback format
    const id = raw.id;
    const name = raw.name || raw.title || "Untitled Product";
    const description = raw.description || "Premium NLBL Collection";
    
    // Handle price - from direct price field or first variant's price
    let price = Number(raw.price);
    if (!Number.isFinite(price) && raw.variants && raw.variants.length > 0) {
      price = Number(raw.variants[0].price);
    }
    if (!Number.isFinite(price)) price = 0;
    
    // Handle image - from image_url, images array, or direct image field
    let imageUrl = raw.image_url || raw.image || "";
    if (!imageUrl && raw.images && raw.images.length > 0) {
      imageUrl = raw.images[0].src || raw.images[0];
    }
    if (!imageUrl) imageUrl = "/placeholder-product.png";
    
    // Handle tags
    const tags = Array.isArray(raw.tags) ? raw.tags : [];
    
    // Handle category
    const category = raw.category || "General";
    
    // Handle active status (visible field from Printify)
    const active = raw.active !== false && raw.visible !== false;

    return {
      id,
      name,
      description,
      category,
      price,
      image_url: imageUrl,
      tags,
      active
    };
  }

  async loadProducts() {
    try {
      // Load from Printify API
      const apiResponse = await fetch("/api/products-list");
      if (!apiResponse.ok) {
        throw new Error("Printify API unavailable");
      }

      const apiData = await apiResponse.json();
      if (!apiData.products || !Array.isArray(apiData.products)) {
        throw new Error("Invalid Printify product payload");
      }

      this.products = apiData.products.map((product) => this.normalizeProduct(product));
      return this.products;
    } catch (apiError) {
      console.warn("Printify API failed, falling back to static:", apiError);
    }

    // Fallback to static JSON
    try {
      const response = await fetch("/shop-products.json");
      if (!response.ok) {
        throw new Error("Failed to load static products");
      }

      const feed = await response.json();
      this.products = (feed.products || [])
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
            <button class="btn-primary buy-now-btn" data-id="${product.id}">Stripe Now</button>
            <button class="paypal-buy-now-btn" data-id="${product.id}">PayPal</button>
          </div>
        </div>
      </div>
    `;
   }
   
   getImageUrl(imagePath) {
     if (!imagePath) return "/placeholder-product.png";
     if (imagePath.startsWith("http")) return imagePath;
     if (imagePath.startsWith("/")) return imagePath;
     return `/${imagePath}`;
   }

  renderProducts(filter = "all") {
    const container = document.querySelector(".products-grid") || document.querySelector("#products-container");
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
    document.querySelectorAll(".buy-now-btn").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this.buyNow(button.dataset.id);
      });
    });

    document.querySelectorAll(".paypal-buy-now-btn").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this.paypalBuyNow(button.dataset.id);
      });
    });

    document.querySelectorAll(".quick-view").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const card = button.closest(".product-card");
        this.showQuickView(card?.dataset.productId);
      });
    });
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
      document.querySelector(".products-grid") || document.querySelector("#products-container");
    if (!container) return;

    container.innerHTML =
      filtered.length > 0
        ? filtered.map((product) => this.createProductCard(product)).join("")
        : '<p class="no-products">No products match your search.</p>';
    this.attachCardListeners();
    this.updateProductCount(filtered.length);
  }

  async buyNow(productId) {
    const product = this.products.find((item) => String(item.id) === String(productId));
    if (!product) return;

    // Ensure Stripe is initialized
    if (!this.stripe) {
      this.showError("Payment system not ready. Please refresh and try again.");
      return;
    }

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: {
            id: product.id,
            name: product.name,
            price: Math.round(product.price * 100),
            quantity: 1,
            image: this.getImageUrl(product.image_url),
          },
        }),
      });

      const session = await response.json();
      if (!session.sessionId) {
        this.showError(session.error || "Checkout failed");
        return;
      }

      const result = await this.stripe.redirectToCheckout({
        sessionId: session.sessionId,
      });
      if (result.error) {
        this.showError(result.error.message);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      this.showError("Failed to initiate checkout");
    }
  }

  async paypalBuyNow(productId) {
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

    const response = await fetch("/api/paypal-client-id");
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

          const response = await fetch("/api/paypal-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderID: order.id,
              productID: product.id,
              amount: product.price,
            }),
          });

          const result = await response.json();
          if (result.success) {
            status.textContent = "Payment successful! Thank you.";
            this.showNotification(`PayPal payment completed for ${product.name}.`);
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

  showQuickView(productId) {
    const product = this.products.find((item) => String(item.id) === String(productId));
    if (!product) return;

    const modal = document.createElement("div");
    modal.className = "quick-view-modal";
    modal.innerHTML = `
      <div class="modal-content">
        <button class="close-modal" aria-label="Close quick view">&times;</button>
        <div class="modal-body">
          <img src="${this.getImageUrl(product.image_url)}" alt="${product.name}">
          <div class="modal-info">
            <h2>${product.name}</h2>
            <p>${product.description}</p>
            <p class="modal-price">${this.formatPrice(product.price)}</p>
            <button class="btn-primary quick-buy-btn" data-id="${product.id}">Buy Now</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector(".close-modal")?.addEventListener("click", () => modal.remove());
    modal.querySelector(".quick-buy-btn")?.addEventListener("click", () => {
      modal.remove();
      this.buyNow(product.id);
    });
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
