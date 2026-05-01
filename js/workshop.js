// js/workshop.js
const workshopProductsEl = document.getElementById('workshop-products');

async function loadWorkshopProducts() {
  try {
    const res = await fetch('/api/printify?action=catalog');
    const data = await res.json();
    const products = data?.catalog || data?.products || [];

    workshopProductsEl.innerHTML = '';

    if (!products.length) {
      workshopProductsEl.textContent = 'No products loaded yet. Try "Sync Printify Catalog" with Lil Mystic.';
      return;
    }

    products.slice(0, 50).forEach(p => {
      const row = document.createElement('div');
      row.className = 'workshop-product-row';
      const title = p.title || p.name || 'Untitled';
      const id = p.id || p.product_id || '—';
      row.innerHTML = `<span>${title}</span><span style="opacity:0.6;">${id}</span>`;
      workshopProductsEl.appendChild(row);
    });
  } catch (err) {
    workshopProductsEl.textContent = `Error loading products: ${err.message}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadWorkshopProducts();
  window.NLBL = window.NLBL || {};
  window.NLBL.loadWorkshopProducts = loadWorkshopProducts;
});
