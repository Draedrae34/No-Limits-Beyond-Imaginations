async function loadShop() {
  const container = document.getElementById("shop-products");
  if (!container) return;

  const res = await fetch("/api/products");
  const data = await res.json();
  if (!data.success) return;

  const activeProducts = data.products.filter((p) => p.active);
  container.innerHTML = "";

  activeProducts.forEach((product) => {
    const imageUrl = resolveProductImageUrl(product.image_filename);
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${imageUrl}" alt="${product.name}" />
      <h3>${product.name}</h3>
      <p>${product.description || ""}</p>
      <div class="product-price">$${product.price}</div>
      <div id="paypal-button-${product.id}"></div>
    `;
    container.appendChild(card);
    // PayPal logic would go here, referencing the dynamic ID
  });
}

function resolveProductImageUrl(imageFilename) {
  if (!imageFilename) return "/placeholder.png";
  if (/^https?:\/\//i.test(imageFilename)) return imageFilename;
  if (imageFilename.startsWith("/")) return imageFilename;
  return `/products/${imageFilename}`;
}

document.addEventListener("DOMContentLoaded", loadShop);
