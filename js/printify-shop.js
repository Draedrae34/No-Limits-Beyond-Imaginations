// Printify Product Integration
class PrintifyShop {
  constructor() {
    this.products = [];
    this.loaded = false;
  }

  async loadProductsFromAPI() {
    try {
      // Load overrides first (contains correct names/prices for some IDs)
      let overrides = {};
      try {
        const oresp = await fetch('/properly-mapped-products.json');
        if (oresp.ok) {
          const odata = await oresp.json();
          if (odata.success && Array.isArray(odata.products)) {
            odata.products.forEach((p) => {
              overrides[p.id] = { name: p.name, price: p.price };
            });
            console.log(`🛠️ Loaded ${Object.keys(overrides).length} override entries`);
          }
        }
      } catch (e) {
        console.warn('⚠️ Could not load overrides file, proceeding without them');
      }

      // Load the new shop-products.json file from Printify
      const response = await fetch('/shop-products.json');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.products && data.products.length > 0) {
          this.products = data.products
            .filter((p) => p.image && p.name)
            .map((p) => {
              return {
                id: p.id,
                name: p.name,
                price: p.price,
                image: p.image,
                category: p.category || 'products',
              };
            });

          this.loaded = true;
          console.log(`🔥 LOADED ${this.products.length} PRODUCTS FROM PRINTIFY!`);
          // build categories list for filters
          this.categories = Array.from(new Set(this.products.map((p) => p.category))).filter(
            (c) => c
          );
          this.filteredProducts = [...this.products];
          this.currentPage = 1;
          this.itemsPerPage = 50;
          this.buildFilters();
          this.renderPage();
          return;
        }
      }

      // fallback hardcoded
      console.log('⚠️ Inventory load failed, using local fallback products');
      this.loadLocalProducts();
    } catch (error) {
      console.error('❌ Error loading products:', error);
      this.loadLocalProducts();
    }
  }

  loadLocalProducts() {
    // YOUR ACTUAL CLOTHING DESIGNS WITH LOGO & GALAXY THEME - 42 PRODUCTS
    this.products = [
      // YOUR T-SHIRTS & TOPS - 11 Products
      {
        id: 1001,
        name: 'Black Tee Front Logo - NLBL Original',
        price: 34.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Black Tee Front Logo.png',
        category: 'shirts',
      },
      {
        id: 1002,
        name: 'Navy Polo Shirt - Classic NLBL',
        price: 39.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Navy Polo Shirt.png',
        category: 'shirts',
      },
      {
        id: 1003,
        name: 'Lavender Long Sleeve - Galaxy Edition',
        price: 44.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Lavender Long Sleeve.png',
        category: 'shirts',
      },
      {
        id: 1004,
        name: 'White Crewneck Sweatshirt - NLBL Essential',
        price: 49.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/White Crewneck Sweatshirt.png',
        category: 'shirts',
      },
      {
        id: 1005,
        name: 'Blue Tie-Dye Tank Top - Galaxy Pattern',
        price: 29.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Blue Tie-Dye Tank Top.png',
        category: 'shirts',
      },
      {
        id: 1006,
        name: 'Pink Crop Hoodie - NLBL Street',
        price: 54.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Pink Crop Hoodie.png',
        category: 'shirts',
      },
      {
        id: 1019,
        name: 'Black Tee Front Logo - Premium Limited',
        price: 44.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Black Tee Front Logo.png',
        category: 'shirts',
      },
      {
        id: 1023,
        name: 'Black Tee Front Logo - Red Edition',
        price: 34.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Black Tee Front Logo.png',
        category: 'shirts',
      },
      {
        id: 1024,
        name: 'Black Tee Front Logo - Blue Edition',
        price: 34.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Black Tee Front Logo.png',
        category: 'shirts',
      },
      {
        id: 1028,
        name: 'Navy Polo Shirt - Athletic Pro',
        price: 49.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Navy Polo Shirt.png',
        category: 'shirts',
      },
      {
        id: 1033,
        name: 'Blue Tie-Dye Tank Top - Street Exclusive',
        price: 34.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Blue Tie-Dye Tank Top.png',
        category: 'shirts',
      },

      // YOUR GALAXY HOODIES - 7 Products
      {
        id: 1007,
        name: 'Purple Galaxy Hoodie - Signature NLBL',
        price: 64.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Purple Galaxy Hoodie.png',
        category: 'hoodies',
      },

      {
        id: 1020,
        name: 'Purple Galaxy Hoodie - Premium Ultra',
        price: 84.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Purple Galaxy Hoodie.png',
        category: 'hoodies',
      },

      {
        id: 1025,
        name: 'Purple Galaxy Hoodie - Black Edition',
        price: 64.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Purple Galaxy Hoodie.png',
        category: 'hoodies',
      },
      {
        id: 1026,
        name: 'Purple Galaxy Hoodie - Pink Edition',
        price: 64.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Purple Galaxy Hoodie.png',
        category: 'hoodies',
      },

      // YOUR JACKETS & OUTERWEAR - 7 Products
      {
        id: 1010,
        name: 'Cyan Denim Jacket - NLBL Streetwear',
        price: 89.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Cyan Denim Jacket.png',
        category: 'jackets',
      },
      {
        id: 1011,
        name: 'Gold Varsity Jacket - Premium NLBL',
        price: 119.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Gold Varsity Jacket.png',
        category: 'jackets',
      },
      {
        id: 1012,
        name: 'Neon Green Bomber Jacket - Galaxy Edition',
        price: 94.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Neon Green Bomber Jacket.png',
        category: 'jackets',
      },
      {
        id: 1013,
        name: 'Orange Windbreaker - NLBL Athletic',
        price: 79.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Orange Windbreaker.png',
        category: 'jackets',
      },
      {
        id: 1021,
        name: 'Gold Varsity Jacket - Executive Class',
        price: 149.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Gold Varsity Jacket.png',
        category: 'jackets',
      },
      {
        id: 1027,
        name: 'Cyan Denim Jacket - Black Edition',
        price: 89.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Cyan Denim Jacket.png',
        category: 'jackets',
      },
      {
        id: 1031,
        name: 'Neon Green Bomber Jacket - Sport Pro',
        price: 104.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Neon Green Bomber Jacket.png',
        category: 'jackets',
      },

      // YOUR PANTS & BOTTOMS - 5 Products
      {
        id: 1014,
        name: 'Coral Shorts - NLBL Summer',
        price: 44.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Coral Shorts.png',
        category: 'pants',
      },
      {
        id: 1015,
        name: 'Red Galaxy Joggers - NLBL Athletic',
        price: 59.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Red Galaxy Joggers.png',
        category: 'pants',
      },
      {
        id: 1016,
        name: 'Silver Track Pants - NLBL Performance',
        price: 54.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Silver Track Pants.png',
        category: 'pants',
      },
      {
        id: 1029,
        name: 'Red Galaxy Joggers - Pro Athletic',
        price: 69.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Red Galaxy Joggers.png',
        category: 'pants',
      },
      {
        id: 1030,
        name: 'Silver Track Pants - Performance Elite',
        price: 64.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Silver Track Pants.png',
        category: 'pants',
      },

      // YOUR HEADWEAR - 4 Products
      {
        id: 1017,
        name: 'Mint Green Beanie - NLBL Essential',
        price: 24.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Mint Green Beanie.png',
        category: 'hats',
      },
      {
        id: 1018,
        name: 'Yellow Snapback Hat - NLBL Street',
        price: 29.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Yellow Snapback Hat.png',
        category: 'hats',
      },
      {
        id: 1034,
        name: 'Yellow Snapback Hat - Street Pro',
        price: 34.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Yellow Snapback Hat.png',
        category: 'hats',
      },
      {
        id: 1035,
        name: 'Mint Green Beanie - Street Essential',
        price: 29.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Mint Green Beanie.png',
        category: 'hats',
      },

      // GALAXY THEME EDITIONS - 4 Products
      {
        id: 1036,
        name: 'Lavender Long Sleeve - Galaxy Ultra',
        price: 54.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Lavender Long Sleeve.png',
        category: 'shirts',
      },
      {
        id: 1037,
        name: 'White Crewneck Sweatshirt - Galaxy Edition',
        price: 59.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/White Crewneck Sweatshirt.png',
        category: 'shirts',
      },
      {
        id: 1038,
        name: 'Orange Windbreaker - Galaxy Storm',
        price: 89.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Orange Windbreaker.png',
        category: 'jackets',
      },
      {
        id: 1039,
        name: 'Coral Shorts - Galaxy Beach',
        price: 49.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Coral Shorts.png',
        category: 'pants',
      },

      // LIMITED EDITIONS - 3 Products
      {
        id: 1040,
        name: 'Black Tee Front Logo - Limited #1',
        price: 54.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Black Tee Front Logo.png',
        category: 'shirts',
      },
      {
        id: 1041,
        name: 'Purple Galaxy Hoodie - Limited #1',
        price: 79.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Purple Galaxy Hoodie.png',
        category: 'hoodies',
      },
      {
        id: 1042,
        name: 'Gold Varsity Jacket - Limited #1',
        price: 174.99,
        image: '/Clothing_Product/reve_images_2026-02-22_04-06-06/Gold Varsity Jacket.png',
        category: 'jackets',
      },
    ];

    this.loaded = true;
    console.log(`🔥 LOADED ${this.products.length} LOCAL FALLBACK PRODUCTS!`);
    console.log(`📊 Source: Local Fallback (API Limits Exceeded)`);
    console.log(`🏷️ Sample: ${this.products[0].name} - $${this.products[0].price}`);
    this.renderProducts();
  }

  showError() {
    const container = document.getElementById('products-container');
    if (container) {
      container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #e94560;">
                    <h2>❌ Unable to load products</h2>
                    <p>Please refresh the page or contact support</p>
                </div>
            `;
    }
  }

  loadSampleProducts() {
    // Realistic market-based pricing as final fallback
    this.products = [
      {
        id: 1001,
        name: 'Black Tee Front Logo',
        price: 24.99,
        image: 'Clothing_Product/reve_images_2026-02-22_04-06-06/Black Tee Front Logo.png',
        category: 'clothing',
      },
      {
        id: 1002,
        name: 'Blue Tie-Dye Tank Top',
        price: 27.99,
        image: 'Clothing_Product/reve_images_2026-02-22_04-06-06/Blue Tie-Dye Tank Top.png',
        category: 'clothing',
      },
      {
        id: 1003,
        name: 'Cyan Denim Jacket',
        price: 79.99,
        image: 'Clothing_Product/reve_images_2026-02-22_04-06-06/Cyan Denim Jacket.png',
        category: 'clothing',
      },
      {
        id: 1004,
        name: 'Gold Varsity Jacket',
        price: 89.99,
        image: 'Clothing_Product/reve_images_2026-02-22_04-06-06/Gold Varsity Jacket.png',
        category: 'clothing',
      },
      {
        id: 1005,
        name: 'Purple Galaxy Hoodie',
        price: 49.99,
        image: 'Clothing_Product/reve_images_2026-02-22_04-06-06/Purple Galaxy Hoodie.png',
        category: 'clothing',
      },
      {
        id: 1006,
        name: 'Red Galaxy Joggers',
        price: 44.99,
        image: 'Clothing_Product/reve_images_2026-02-22_04-06-06/Red Galaxy Joggers.png',
        category: 'clothing',
      },
      {
        id: 1007,
        name: 'White Crewneck Sweatshirt',
        price: 39.99,
        image: 'Clothing_Product/reve_images_2026-02-22_04-06-06/White Crewneck Sweatshirt.png',
        category: 'clothing',
      },
      {
        id: 1008,
        name: 'Yellow Snapback Hat',
        price: 29.99,
        image: 'Clothing_Product/reve_images_2026-02-22_04-06-06/Yellow Snapback Hat.png',
        category: 'accessories',
      },
    ];
    this.loaded = true;
    console.log(`🏪 Loaded ${this.products.length} products with market-based pricing`);
    this.renderProducts();
  }

  async createOrder(productId, quantity = 1) {
    try {
      // Redirect to checkout page with product info
      window.location.href = `checkout.html?product=${productId}&quantity=${quantity}`;
    } catch (error) {
      console.error('Order error:', error);
      alert('Failed to create order. Please try again.');
    }
  }

  // create individual card markup
  createCardMarkup(product) {
    return `
            <div class="product-card">
                <div class="product-brand">
                    <img src="./Logo/Favison.png" alt="NLBL" class="brand-icon">
                    <span class="brand-text">NLBL</span>
                </div>
                <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="category">${product.category.toUpperCase()}</p>
                    <p class="price">$${product.price}</p>
                </div>
                <button class="buy-button" onclick="printifyShop.createOrder(${product.id})">
                    Buy Now - Enterprise
                </button>
            </div>
        `;
  }

  // render current page of filteredProducts
  renderPage() {
    const container = document.getElementById('products-container');
    if (!container) return;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const pageItems = this.filteredProducts.slice(start, start + this.itemsPerPage);
    if (pageItems.length === 0 && this.currentPage > 1) {
      this.currentPage = 1;
      return this.renderPage();
    }
    container.innerHTML = pageItems.map((p) => this.createCardMarkup(p)).join('');
    this.updatePagination();
  }

  buildFilters() {
    const select = document.getElementById('category-select');
    const search = document.getElementById('search-input');
    if (select) {
      this.categories.forEach((cat) => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat.toUpperCase();
        select.appendChild(opt);
      });
      select.addEventListener('change', () => this.applyFilters());
    }
    if (search) {
      search.addEventListener('input', () => this.applyFilters());
    }
  }

  applyFilters() {
    const select = document.getElementById('category-select');
    const search = document.getElementById('search-input');
    const catVal = select ? select.value.toLowerCase() : '';
    const term = search ? search.value.toLowerCase() : '';
    this.filteredProducts = this.products.filter((p) => {
      let ok = true;
      if (catVal) ok = p.category.toLowerCase() === catVal;
      if (term) ok = ok && p.name.toLowerCase().includes(term);
      return ok;
    });
    this.currentPage = 1;
    this.renderPage();
  }

  updatePagination() {
    const pag = document.getElementById('pagination');
    if (!pag) return;
    const total = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    pag.innerHTML = '';
    const createBtn = (text, page, disabled = false, active = false) => {
      const btn = document.createElement('button');
      btn.textContent = text;
      if (disabled) btn.disabled = true;
      if (active) btn.classList.add('active');
      btn.addEventListener('click', () => {
        this.currentPage = page;
        this.renderPage();
      });
      pag.appendChild(btn);
    };
    createBtn('«', 1, this.currentPage === 1);
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
        createBtn(i, i, false, i === this.currentPage);
      } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
        const span = document.createElement('span');
        span.textContent = '...';
        span.style.padding = '0 0.5rem';
        pag.appendChild(span);
      }
    }
    createBtn('»', total, this.currentPage === total);
  }
}

// Initialize shop
const printifyShop = new PrintifyShop();

// Load products when page loads
document.addEventListener('DOMContentLoaded', () => {
  printifyShop.loadProductsFromAPI();
});
