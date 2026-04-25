/**
 * NLBL Shop Loader
 * Loads products from shop-products.json and displays them correctly
 * with proper images, prices, and Stripe integration
 */

class NLBLShopLoader {
  constructor() {
    this.products = [];
    this.cart = [];
    this.currentFilter = 'all';
    this.stripe = Stripe(
      'pk_live_51St8KxGbrgLPuQFwopxDC9rr1o2hYJujJ7ceGP9RgxafShwb5zlt1i96vN9jAcktWLdAsvanJdivugVGWrT1UdlJ00cLbBlzuF'
    );

    this.init();
  }

  async init() {
    console.log('🌟 Initializing NLBL Shop...');

    // Load products
    await this.loadProducts();

    // Render products
    this.renderProducts();

    // Setup event listeners
    this.setupEventListeners();

    console.log('✅ Shop ready with ' + this.products.length + ' products');
  }

  async loadProducts() {
    try {
      const response = await fetch('/shop-products.json');
      if (!response.ok) throw new Error('Failed to load products');

      const feed = await response.json();
      this.products = feed.products || [];

      console.log(`📦 Loaded ${this.products.length} products`);
      return this.products;
    } catch (error) {
      console.error('❌ Error loading products:', error);
      this.showError('Failed to load products. Please refresh the page.');
      return [];
    }
  }

  renderProducts(filter = 'all') {
    const container =
      document.querySelector('.products-grid') || document.querySelector('#products-container');

    if (!container) {
      console.warn('⚠️  No products container found');
      return;
    }

    // Filter products
    let filtered = this.products;
    if (filter !== 'all') {
      filtered = this.products.filter((p) => p.category.toLowerCase() === filter.toLowerCase());
    }

    console.log(`📊 Rendering ${filtered.length} products (filter: ${filter})`);

    // Clear container
    container.innerHTML = '';

    if (filtered.length === 0) {
      container.innerHTML = '<p class="no-products">No products found in this category.</p>';
      return;
    }

    // Create product cards
    const html = filtered.map((product) => this.createProductCard(product)).join('');
    container.innerHTML = html;

    // Attach event listeners to cards
    this.attachCardListeners();
  }

  createProductCard(product) {
    const imageUrl = this.getImageUrl(product.image);
    const priceDisplay = this.formatPrice(product.price);

    return `
            <div class="product-card quantum-card" data-product-id="${product.id}">
                <div class="product-image-container">
                    <img src="${imageUrl}"
                         alt="${product.name}"
                         class="product-image"
                         onerror="this.src='/placeholder-product.png'">
                    <div class="product-overlay">
                        <button class="quick-view-btn" data-id="${product.id}">Quick View</button>
                    </div>
                </div>

                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-category">${product.category}</p>
                    <p class="product-description">${product.description || 'Premium NLBL Collection'}</p>

                    <div class="product-pricing">
                        <span class="price">${priceDisplay}</span>
                        <span class="currency">USD</span>
                    </div>

                    <div class="product-actions">
                        <button class="add-to-cart-btn" data-id="${product.id}">
                            🛒 Add to Cart
                        </button>
                        <button class="buy-now-btn" data-id="${product.id}">
                            💳 Stripe Now
                        </button>
                        <button class="paypal-buy-now-btn" data-id="${product.id}">
                            🅿️ PayPal
                        </button>
                    </div>
                </div>

                <div class="product-tags">
                    ${product.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
  }

  getImageUrl(imagePath) {
    if (!imagePath) return '/placeholder-product.png';

    // If it's already a full URL
    if (imagePath.startsWith('http')) return imagePath;

    // If it's a relative path
    if (imagePath.startsWith('/')) return imagePath;

    // Otherwise prepend domain
    return `/${imagePath}`;
  }

  formatPrice(price) {
    if (typeof price === 'number') {
      return `$${price.toFixed(2)}`;
    }
    return `$${parseFloat(price).toFixed(2)}`;
  }

  attachCardListeners() {
    // Add to cart
    document.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = btn.dataset.id;
        this.addToCart(productId);
      });
    });

    // Buy now
    document.querySelectorAll('.buy-now-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = btn.dataset.id;
        this.buyNow(productId);
      });
    });

    // PayPal buy now
    document.querySelectorAll('.paypal-buy-now-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = btn.dataset.id;
        this.paypalBuyNow(productId);
      });
    });

    // Quick view
    document.querySelectorAll('.quick-view-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = btn.closest('.product-card').dataset.productId;
        this.showQuickView(productId);
      });
    });
  }

  setupEventListeners() {
    // Category filters
    document.querySelectorAll('.category-filter').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.category-filter').forEach((b) => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.category || 'all';
        this.renderProducts(this.currentFilter);
      });
    });

    // Search
    const searchInput = document.querySelector('#product-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchProducts(e.target.value);
      });
    }
  }

  searchProducts(query) {
    const filtered = this.products.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
    );

    const container =
      document.querySelector('.products-grid') || document.querySelector('#products-container');
    if (container) {
      container.innerHTML =
        filtered.length > 0
          ? filtered.map((p) => this.createProductCard(p)).join('')
          : '<p class="no-products">No products match your search.</p>';
      this.attachCardListeners();
    }
  }

  addToCart(productId) {
    const product = this.products.find((p) => p.id == productId);
    if (!product) return;

    this.cart.push(product);
    localStorage.setItem('nlbl_cart', JSON.stringify(this.cart));

    console.log(`✅ Added to cart: ${product.name}`);
    this.showNotification(`Added ${product.name} to cart!`);
  }

  async buyNow(productId) {
    const product = this.products.find((p) => p.id == productId);
    if (!product) return;

    console.log('🛒 Initiating checkout for:', product.name);

    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: {
            id: product.id,
            name: product.name,
            price: Math.round(product.price * 100), // cents
            quantity: 1,
            image: this.getImageUrl(product.image),
          },
        }),
      });

      const session = await response.json();

      if (session.sessionId) {
        // Redirect to Stripe checkout
        const result = await this.stripe.redirectToCheckout({
          sessionId: session.sessionId,
        });

        if (result.error) {
          this.showError(result.error.message);
        }
      } else {
        this.showError(session.error || 'Checkout failed');
      }
    } catch (error) {
      console.error('❌ Checkout error:', error);
      this.showError('Failed to initiate checkout');
    }
  }

  async paypalBuyNow(productId) {
    const product = this.products.find((p) => p.id == productId);
    if (!product) return;

    this.currentPaypalProduct = product;
    this.showPaypalPanel();
    await this.loadPaypalSdk();
    this.renderPaypalButton();
  }

  showPaypalPanel() {
    const panel = document.getElementById('paypal-checkout-panel');
    const status = document.getElementById('paypal-checkout-status');
    const closeButton = panel.querySelector('#paypal-close');

    panel.classList.remove('hidden');
    if (!closeButton.dataset.paypalListenerAttached) {
      closeButton.addEventListener('click', () => {
        panel.classList.add('hidden');
        status.textContent = '';
        document.getElementById('paypal-button-container').innerHTML = '';
      });
      closeButton.dataset.paypalListenerAttached = 'true';
    }
  }

  async loadPaypalSdk() {
    if (window.paypal) return;

    const response = await fetch('/api/paypal-client-id');
    const data = await response.json();
    if (!response.ok || !data.clientId) {
      throw new Error(data.error || 'Failed to load PayPal configuration');
    }

    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(data.clientId)}&currency=USD`;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  renderPaypalButton() {
    const product = this.currentPaypalProduct;
    const container = document.getElementById('paypal-button-container');
    const status = document.getElementById('paypal-checkout-status');

    if (!product || !container || !window.paypal) return;

    container.innerHTML = '';
    status.textContent = `Paying for ${product.name}...`;

    window.paypal.Buttons({
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: product.price.toFixed(2),
              },
              description: product.name,
              custom_id: String(product.id),
            },
          ],
        });
      },
      onApprove: async (data, actions) => {
        status.textContent = 'Capturing your payment...';
        const order = await actions.order.capture();

        const response = await fetch('/api/paypal-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderID: order.id,
            productID: product.id,
            amount: product.price,
          }),
        });

        const result = await response.json();
        if (result.success) {
          status.textContent = 'Payment successful! Thank you.';
          this.showNotification(`PayPal payment completed for ${product.name}.`);
        } else {
          status.textContent = 'Payment capture failed. Please try again.';
          this.showError(result.error || 'PayPal payment failed');
        }
      },
      onCancel: () => {
        status.textContent = 'Payment cancelled. You can try again anytime.';
      },
      onError: (err) => {
        console.error('PayPal error:', err);
        status.textContent = 'PayPal checkout failed. Please try again later.';
        this.showError('PayPal checkout failed.');
      },
    }).render('#paypal-button-container');
  }

  showQuickView(productId) {
    const product = this.products.find((p) => p.id == productId);
    if (!product) return;

    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal">&times;</button>
                <div class="modal-body">
                    <img src="${this.getImageUrl(product.image)}" alt="${product.name}">
                    <div class="modal-info">
                        <h2>${product.name}</h2>
                        <p>${product.description}</p>
                        <p class="modal-price">${this.formatPrice(product.price)}</p>
                        <button class="buy-now-btn" data-id="${product.id}">Buy Now</button>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    modal.querySelector('.buy-now-btn').addEventListener('click', () => {
      modal.remove();
      this.buyNow(productId);
    });
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }

  showError(message) {
    const error = document.createElement('div');
    error.className = 'error-notification';
    error.textContent = message;
    document.body.appendChild(error);

    setTimeout(() => error.remove(), 5000);
  }
}

// Initialize shop when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.shopLoader = new NLBLShopLoader();
});
