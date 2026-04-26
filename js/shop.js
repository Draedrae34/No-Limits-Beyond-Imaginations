// js/shop.js — No Limits Beyond Limitations Shop
// Fetches live catalog from /api/printify?action=catalog
// Deduplicates, renders product grid, handles filtering & cart

(function () {
  'use strict';

  const API_URL = '/api/printify?action=catalog';
  const BRAND_PURPLE = '#9b59b6';
  const BRAND_GOLD = '#f5c842';
  const COSMIC_DARK = '#0a0a1a';
  const COSMIC_CARD = '#12122a';
  const COSMIC_BORDER = '#2a1a4e';
  const STAR_WHITE = '#e8e0f0';

  let allProducts = [];
  let cart = [];

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .nlbl-loader { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 20px; gap:20px; }
      .nlbl-spinner { width:50px; height:50px; border:3px solid ${COSMIC_BORDER}; border-top:3px solid ${BRAND_PURPLE}; border-radius:50%; animation:nlbl-spin .8s linear infinite; }
      @keyframes nlbl-spin { to { transform:rotate(360deg); } }
      .nlbl-loader-text { color:${STAR_WHITE}; font-size:14px; letter-spacing:2px; text-transform:uppercase; opacity:.7; }

      .nlbl-product-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:24px; padding:30px 20px; max-width:1400px; margin:0 auto; }
      @media(max-width:640px){ .nlbl-product-grid { grid-template-columns:1fr 1fr; gap:12px; padding:16px 10px; } }

      .nlbl-product-card { background:${COSMIC_CARD}; border:1px solid ${COSMIC_BORDER}; border-radius:12px; overflow:hidden; transition:transform .3s,box-shadow .3s,border-color .3s; cursor:pointer; position:relative; }
      .nlbl-product-card:hover { transform:translateY(-6px); box-shadow:0 12px 40px rgba(155,89,182,.3); border-color:${BRAND_PURPLE}; }

      .nlbl-img-wrap { position:relative; width:100%; padding-top:100%; background:${COSMIC_DARK}; overflow:hidden; }
      .nlbl-img-wrap img { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; transition:opacity .4s,transform .4s; }
      .nlbl-img-wrap img.nlbl-img-back { opacity:0; }
      .nlbl-product-card:hover .nlbl-img-front { opacity:0; transform:scale(1.05); }
      .nlbl-product-card:hover .nlbl-img-back { opacity:1; transform:scale(1.05); }

      .nlbl-img-dots { position:absolute; bottom:8px; left:50%; transform:translateX(-50%); display:flex; gap:6px; z-index:2; }
      .nlbl-img-dot { width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,.4); border:none; cursor:pointer; transition:background .2s; padding:0; }
      .nlbl-img-dot.active { background:${BRAND_PURPLE}; box-shadow:0 0 6px ${BRAND_PURPLE}; }

      .nlbl-badge { position:absolute; top:10px; left:10px; background:${BRAND_PURPLE}; color:#fff; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:4px 10px; border-radius:20px; z-index:2; }

      .nlbl-card-body { padding:16px; }
      .nlbl-product-title { color:#fff; font-size:15px; font-weight:600; margin:0 0 6px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .nlbl-product-desc { color:rgba(255,255,255,.5); font-size:12px; margin:0 0 12px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .nlbl-price-row { display:flex; align-items:center; justify-content:space-between; margin-top:auto; }
      .nlbl-price { color:${BRAND_GOLD}; font-size:20px; font-weight:700; }
      .nlbl-add-btn { background:linear-gradient(135deg,${BRAND_PURPLE},#7b2d8e); color:#fff; border:none; padding:8px 18px; border-radius:8px; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; cursor:pointer; transition:transform .2s,box-shadow .2s; }
      .nlbl-add-btn:hover { transform:scale(1.05); box-shadow:0 4px 15px rgba(155,89,182,.5); }
      .nlbl-add-btn.added { background:linear-gradient(135deg,#27ae60,#2ecc71); pointer-events:none; }

      .nlbl-tags { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px; }
      .nlbl-tag { font-size:10px; color:rgba(255,255,255,.5); background:rgba(155,89,182,.15); padding:2px 8px; border-radius:10px; letter-spacing:.5px; }

      .nlbl-empty,.nlbl-error { text-align:center; padding:60px 20px; color:${STAR_WHITE}; }
      .nlbl-empty h3,.nlbl-error h3 { font-size:20px; margin-bottom:10px; color:#fff; }
      .nlbl-empty p,.nlbl-error p { opacity:.6; font-size:14px; }
      .nlbl-error h3 { color:#e74c3c; }

      .nlbl-product-count { text-align:center; color:rgba(255,255,255,.4); font-size:13px; letter-spacing:1px; padding:10px 0 0; text-transform:uppercase; }

      .nlbl-cart-float { position:fixed; bottom:24px; right:24px; background:linear-gradient(135deg,${BRAND_PURPLE},#7b2d8e); color:#fff; border:none; width:56px; height:56px; border-radius:50%; font-size:24px; cursor:pointer; box-shadow:0 4px 20px rgba(155,89,182,.5); z-index:1000; display:none; align-items:center; justify-content:center; transition:transform .2s; }
      .nlbl-cart-float:hover { transform:scale(1.1); }
      .nlbl-cart-float.visible { display:flex; }
      .nlbl-cart-badge { position:absolute; top:-4px; right:-4px; background:${BRAND_GOLD}; color:#000; font-size:11px; font-weight:800; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; }

      .nlbl-modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,.85); z-index:2000; display:flex; align-items:center; justify-content:center; opacity:0; pointer-events:none; transition:opacity .3s; }
      .nlbl-modal-overlay.open { opacity:1; pointer-events:all; }
      .nlbl-modal { background:${COSMIC_CARD}; border:1px solid ${COSMIC_BORDER}; border-radius:16px; max-width:500px; width:90%; max-height:90vh; overflow-y:auto; padding:0; transform:scale(.9); transition:transform .3s; }
      .nlbl-modal-overlay.open .nlbl-modal { transform:scale(1); }
      .nlbl-modal-img { width:100%; aspect-ratio:1; object-fit:cover; border-radius:16px 16px 0 0; }
      .nlbl-modal-body { padding:24px; }
      .nlbl-modal-title { color:#fff; font-size:22px; font-weight:700; margin:0 0 8px; }
      .nlbl-modal-cat { color:${BRAND_PURPLE}; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px; }
      .nlbl-modal-desc { color:rgba(255,255,255,.6); font-size:14px; line-height:1.6; margin-bottom:20px; }
      .nlbl-modal-price { color:${BRAND_GOLD}; font-size:28px; font-weight:800; margin-bottom:20px; }
      .nlbl-modal-close { position:absolute; top:12px; right:16px; background:rgba(0,0,0,.6); color:#fff; border:none; width:36px; height:36px; border-radius:50%; font-size:18px; cursor:pointer; z-index:2; }
      .nlbl-modal-add { width:100%; padding:14px; background:linear-gradient(135deg,${BRAND_PURPLE},#7b2d8e); color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:700; letter-spacing:1px; text-transform:uppercase; cursor:pointer; transition:box-shadow .2s; }
      .nlbl-modal-add:hover { box-shadow:0 4px 20px rgba(155,89,182,.5); }
      .nlbl-modal-thumbs { display:flex; gap:8px; margin-top:12px; overflow-x:auto; padding-bottom:4px; }
      .nlbl-modal-thumb { width:60px; height:60px; border-radius:8px; object-fit:cover; border:2px solid transparent; cursor:pointer; transition:border-color .2s; flex-shrink:0; }
      .nlbl-modal-thumb.active,.nlbl-modal-thumb:hover { border-color:${BRAND_PURPLE}; }
    `;
    document.head.appendChild(style);
  }

  function setupDOM() {
    const select = document.querySelector('select');
    if (!select) { console.error('[Shop] No select element found'); return null; }

    const countEl = document.createElement('div');
    countEl.className = 'nlbl-product-count';
    countEl.id = 'nlbl-product-count';

    const grid = document.createElement('div');
    grid.className = 'nlbl-product-grid';
    grid.id = 'nlbl-product-grid';

    const filterParent = select.closest('div') || select.closest('label') || select.parentElement;
    const insertAfter = filterParent || select;
    insertAfter.parentNode.insertBefore(countEl, insertAfter.nextSibling);
    countEl.parentNode.insertBefore(grid, countEl.nextSibling);

    const modal = document.createElement('div');
    modal.className = 'nlbl-modal-overlay';
    modal.id = 'nlbl-modal';
    modal.innerHTML = '<div class="nlbl-modal" id="nlbl-modal-content"></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    const cartBtn = document.createElement('button');
    cartBtn.className = 'nlbl-cart-float';
    cartBtn.id = 'nlbl-cart-btn';
    cartBtn.innerHTML = '🛒<span class="nlbl-cart-badge" id="nlbl-cart-count">0</span>';
    cartBtn.addEventListener('click', showCartSummary);
    document.body.appendChild(cartBtn);

    select.addEventListener('change', () => { renderProducts(select.value); });
    return { grid, select, countEl };
  }

  async function fetchCatalog() {
    const grid = document.getElementById('nlbl-product-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="nlbl-loader" style="grid-column:1/-1;"><div class="nlbl-spinner"></div><div class="nlbl-loader-text">Loading cosmic collection...</div></div>';

    try {
      const resp = await fetch(API_URL);
      if (!resp.ok) throw new Error('API returned ' + resp.status);
      const data = await resp.json();
      const raw = data.catalog || data.products || [];

      const seen = new Map();
      raw.forEach(p => {
        const key = p.title.trim().toLowerCase();
        if (!seen.has(key) || (p.images || []).length > (seen.get(key).images || []).length) {
          seen.set(key, p);
        }
      });
      allProducts = Array.from(seen.values());

      populateCategories();
      renderProducts('all');
    } catch (err) {
      console.error('[Shop] Fetch error:', err);
      grid.innerHTML = '<div class="nlbl-error" style="grid-column:1/-1;"><h3>Connection Lost</h3><p>Could not reach the cosmic vault. Please refresh and try again.</p><p style="font-size:11px;opacity:.4;margin-top:12px;">' + err.message + '</p></div>';
    }
  }

  function populateCategories() {
    const select = document.querySelector('select');
    if (!select) return;
    select.innerHTML = '<option value="all">All Products</option>';
    const cats = [...new Set(allProducts.map(p => p.category))].sort();
    cats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ') + 's';
      select.appendChild(opt);
    });
  }

  function renderProducts(category) {
    const grid = document.getElementById('nlbl-product-grid');
    const countEl = document.getElementById('nlbl-product-count');
    if (!grid) return;

    const filtered = category === 'all' ? allProducts : allProducts.filter(p => p.category === category);

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="nlbl-empty" style="grid-column:1/-1;"><h3>No Products Found</h3><p>This category is waiting for new cosmic designs.</p></div>';
      if (countEl) countEl.textContent = '';
      return;
    }
    if (countEl) countEl.textContent = filtered.length + ' product' + (filtered.length !== 1 ? 's' : '') + ' found';

    grid.innerHTML = filtered.map(p => createProductCard(p)).join('');

    grid.querySelectorAll('.nlbl-product-card').forEach(card => {
      const id = card.dataset.id;
      const product = allProducts.find(pr => pr.id === id);
      if (!product) return;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.nlbl-add-btn') || e.target.closest('.nlbl-img-dot')) return;
        openModal(product);
      });

      const addBtn = card.querySelector('.nlbl-add-btn');
      if (addBtn) addBtn.addEventListener('click', (e) => { e.stopPropagation(); addToCart(product, addBtn); });

      card.querySelectorAll('.nlbl-img-dot').forEach(dot => {
        dot.addEventListener('click', (e) => { e.stopPropagation(); switchImage(card, product, parseInt(dot.dataset.idx)); });
      });
    });
  }

  function createProductCard(p) {
    const images = p.images || [];
    const mainImg = images[0] || '';
    const backImg = images[1] || mainImg;
    const desc = p.description || 'Premium cosmic apparel from NLBL';
    const tags = (p.tags || []).slice(0, 3);
    const inCart = cart.some(c => c.id === p.id);
    const dots = images.length > 1 ? '<div class="nlbl-img-dots">' + images.slice(0, 5).map((_, i) => '<button class="nlbl-img-dot ' + (i === 0 ? 'active' : '') + '" data-idx="' + i + '"></button>').join('') + '</div>' : '';

    return '<div class="nlbl-product-card" data-id="' + p.id + '">' +
      '<div class="nlbl-img-wrap">' +
        '<span class="nlbl-badge">' + (p.category || 'apparel').replace('-', ' ') + '</span>' +
        '<img class="nlbl-img-front" src="' + mainImg + '" alt="' + p.title + '" loading="lazy" />' +
        (images.length > 1 ? '<img class="nlbl-img-back" src="' + backImg + '" alt="' + p.title + ' back" loading="lazy" />' : '') +
        dots +
      '</div>' +
      '<div class="nlbl-card-body">' +
        (tags.length ? '<div class="nlbl-tags">' + tags.map(t => '<span class="nlbl-tag">' + t + '</span>').join('') + '</div>' : '') +
        '<h3 class="nlbl-product-title">' + p.title + '</h3>' +
        '<p class="nlbl-product-desc">' + desc + '</p>' +
        '<div class="nlbl-price-row">' +
          '<span class="nlbl-price">$' + p.price + '</span>' +
          '<button class="nlbl-add-btn ' + (inCart ? 'added' : '') + '">' + (inCart ? '✓ Added' : 'Add to Cart') + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function switchImage(card, product, idx) {
    const images = product.images || [];
    if (!images[idx]) return;
    const frontImg = card.querySelector('.nlbl-img-front');
    if (frontImg) frontImg.src = images[idx];
    card.querySelectorAll('.nlbl-img-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  function openModal(product) {
    const overlay = document.getElementById('nlbl-modal');
    const content = document.getElementById('nlbl-modal-content');
    if (!overlay || !content) return;
    const images = product.images || [];
    const mainImg = images[0] || '';
    const desc = product.description || 'Premium cosmic apparel from No Limits Beyond Limitations. Designed to honor, celebrate, and inspire.';

    content.innerHTML = '<div style="position:relative;">' +
      '<button class="nlbl-modal-close" id="nlbl-modal-close-btn">&times;</button>' +
      '<img class="nlbl-modal-img" id="nlbl-modal-main-img" src="' + mainImg + '" alt="' + product.title + '" />' +
      '</div><div class="nlbl-modal-body">' +
      '<div class="nlbl-modal-cat">' + (product.category || 'apparel').replace('-', ' ') + '</div>' +
      '<h2 class="nlbl-modal-title">' + product.title + '</h2>' +
      '<p class="nlbl-modal-desc">' + desc + '</p>' +
      (images.length > 1 ? '<div class="nlbl-modal-thumbs">' + images.map((img, i) => '<img class="nlbl-modal-thumb ' + (i === 0 ? 'active' : '') + '" src="' + img + '" alt="View ' + (i+1) + '" data-idx="' + i + '" />').join('') + '</div>' : '') +
      '<div class="nlbl-modal-price">$' + product.price + '</div>' +
      '<button class="nlbl-modal-add" id="nlbl-modal-add-btn">Add to Cart</button></div>';

    document.getElementById('nlbl-modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('nlbl-modal-add-btn').addEventListener('click', () => {
      addToCart(product);
      document.getElementById('nlbl-modal-add-btn').textContent = '✓ Added to Cart';
      document.getElementById('nlbl-modal-add-btn').style.background = 'linear-gradient(135deg,#27ae60,#2ecc71)';
      setTimeout(closeModal, 800);
    });
    content.querySelectorAll('.nlbl-modal-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        document.getElementById('nlbl-modal-main-img').src = images[parseInt(thumb.dataset.idx)];
        content.querySelectorAll('.nlbl-modal-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const overlay = document.getElementById('nlbl-modal');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function addToCart(product, btnEl) {
    const exists = cart.find(c => c.id === product.id);
    if (exists) { exists.qty += 1; } else { cart.push({ ...product, qty: 1 }); }
    updateCartBadge();
    if (btnEl) {
      btnEl.textContent = '✓ Added';
      btnEl.classList.add('added');
      setTimeout(() => { btnEl.textContent = 'Add to Cart'; btnEl.classList.remove('added'); }, 1500);
    }
    try { sessionStorage.setItem('nlbl_cart', JSON.stringify(cart)); } catch (e) {}
  }

  function updateCartBadge() {
    const btn = document.getElementById('nlbl-cart-btn');
    const count = document.getElementById('nlbl-cart-count');
    if (!btn || !count) return;
    const total = cart.reduce((sum, c) => sum + c.qty, 0);
    count.textContent = total;
    btn.classList.toggle('visible', total > 0);
  }

  function showCartSummary() {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, c) => sum + (parseFloat(c.price) * c.qty), 0);
    const paypalModal = document.querySelector('[class*="paypal"]') || document.getElementById('paypal-modal');
    if (paypalModal) { paypalModal.style.display = 'flex'; return; }
    alert('Your Cart\n\n' + cart.map(c => c.title + ' x' + c.qty + ' - $' + (parseFloat(c.price) * c.qty).toFixed(2)).join('\n') + '\n\nTotal: $' + total.toFixed(2));
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  function restoreCart() {
    try { const saved = sessionStorage.getItem('nlbl_cart'); if (saved) { cart = JSON.parse(saved); updateCartBadge(); } } catch (e) {}
  }

  function init() {
    injectStyles();
    const dom = setupDOM();
    if (!dom) { console.error('[Shop] Could not set up DOM'); return; }
    restoreCart();
    fetchCatalog();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
