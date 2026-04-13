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
      // Fetching the specifically defined designed products first
      const response = await fetch('/shop-products.json');
      if (!response.ok) throw new Error('Failed to load products');

      const feed = await response.json();
      // Combine designed products with the automated inventory if needed
      this.products = feed.products || feed || [];

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
    
    // Generate size options for different countries
    const sizeOptions = product.sizes ? product.sizes.map(s => 
      `<option value="${s.us}">US: ${s.us} / EU: ${s.eu} / UK: ${s.uk} / JP: ${s.jp}</option>`
    ).join('') : '<option>One Size</option>';

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
                    
                    <div class="product-size-selector">
                        <label style="font-size: 0.7rem; color: #00ffff;">SELECT SIZE (INTL):</label>
                        <select class="size-dropdown" style="width: 100%; background: #000; color: #fff; border: 1px solid #333; margin-bottom: 10px;">
                            ${sizeOptions}
                        </select>
                    </div>

                    <div class="product-actions">
                        <button class="add-to-cart-btn" data-id="${product.id}">
                            🛒 Add to Cart
                        </button>
                        <button class="buy-now-btn" data-id="${product.id}">
                            💳 Buy Now
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
      const response = await fetch('/api/stripe-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1,
          customer_info: { email: 'test@example.com' } // Placeholder for test
        }),
      });

      const data = await response.json();

      if (data.success && data.client_secret) {
        // Handle payment with Stripe Elements or confirm directly if testing
        // For a "Complete Test", we'll alert the secret to prove the backend works
        console.log('Payment Intent Created:', data.payment_intent_id);
        this.showNotification('Payment Intent created! Finalizing transaction...');
        
        // In a real flow, you'd use: 
        // await this.stripe.confirmCardPayment(data.client_secret, ...)
        alert('TEST SUCCESS: PaymentIntent generated. Check Stripe Dashboard.');
      } else {
        this.showError(data.error || 'Checkout failed');
      }
    } catch (error) {
      console.error('❌ Checkout error:', error);
      this.showError('Failed to initiate checkout');
    }
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
