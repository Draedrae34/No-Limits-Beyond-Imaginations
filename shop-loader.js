async function loadShop() {
  const container = document.getElementById("shop-products");
  if (!container) return;

  const res = await fetch("/api/products");
  const data = await res.json();
  if (!data.success) return;

  const activeProducts = data.products.filter((p) => p.active);
  container.innerHTML = "";

  activeProducts.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${product.image_filename ? `/products/${product.image_filename}` : "/placeholder.png"}" alt="${product.name}" />
      <h3>${product.name}</h3>
      <p>${product.description || ""}</p>
      <div class="product-price">$${product.price}</div>
      <div id="paypal-button-${product.id}"></div>
    `;
    container.appendChild(card);
    // PayPal logic would go here, referencing the dynamic ID
  });
}

document.addEventListener("DOMContentLoaded", loadShop);
