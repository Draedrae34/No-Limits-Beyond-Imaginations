// TAB SWITCHING
const tabs = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".panel");

tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabs.forEach((b) => b.classList.remove("active"));
    panels.forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// ORDERS
async function loadOrders() {
  const res = await fetch("/api/orders");
  const data = await res.json();
  const orders = Array.isArray(data) ? data : data.orders || [];

  const tbody = document.querySelector("#orders-table tbody");
  const status = document.getElementById("orders-status");
  tbody.innerHTML = "";
  status.textContent = "Refreshing orders...";

  if (!Array.isArray(orders) || !orders.length) {
    tbody.innerHTML = '<tr><td colspan="8">No orders found.</td></tr>';
    status.textContent = orders.length === 0 ? "No orders found." : "Unable to load orders.";
    return;
  }

  orders.forEach((o) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${o.id}</td>
      <td>${o.product_id || "N/A"}</td>
      <td>${formatCurrency(o.amount)}</td>
      <td>${o.buyer_name || "Unknown"}</td>
      <td>${o.buyer_email || "Unknown"}</td>
      <td>${(o.fulfillment_status || "pending").toUpperCase()}</td>
      <td>${new Date(o.created_at).toLocaleString()}</td>
      <td><button class="action-btn view-order-btn" data-id="${o.id}">View</button></td>
    `;
    tbody.appendChild(row);
  });

  attachOrderActionListeners();
  status.textContent = `Loaded ${orders.length} order${orders.length === 1 ? "" : "s"}.`;
}

function attachOrderActionListeners() {
  document.querySelectorAll(".view-order-btn").forEach((button) => {
    button.addEventListener("click", () => openOrderModal(button.dataset.id));
  });
}

async function openOrderModal(orderId) {
  if (!orderId) return;

  const res = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    alert(data.error || "Unable to load order details.");
    return;
  }

  populateOrderModal(data.order);
  const modal = document.getElementById("order-modal");
  if (modal) {
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
  }
}

function closeOrderModal() {
  const modal = document.getElementById("order-modal");
  if (modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
}

function populateOrderModal(order) {
  const grid = document.getElementById("order-detail-grid");
  const statusSelect = document.getElementById("order-fulfillment-status");
  const notes = document.getElementById("order-fulfillment-notes");
  const title = document.getElementById("order-modal-title");
  const statusText = document.getElementById("order-fulfillment-status-text");
  const modal = document.getElementById("order-modal");

  if (!grid || !statusSelect || !notes || !title || !statusText || !modal) return;

  title.textContent = `Order #${order.id}`;
  grid.innerHTML = `
    <div><small>Order</small><strong>${order.id}</strong></div>
    <div><small>PayPal</small><strong>${order.paypal_order_id || "N/A"}</strong></div>
    <div><small>Product ID</small><strong>${order.product_id || "N/A"}</strong></div>
    <div><small>Amount</small><strong>${formatCurrency(order.amount)}</strong></div>
    <div><small>Buyer</small><strong>${order.buyer_name || "Unknown"}</strong></div>
    <div><small>Email</small><strong>${order.buyer_email || "Unknown"}</strong></div>
    <div><small>Created</small><strong>${new Date(order.created_at).toLocaleString()}</strong></div>
    <div><small>Fulfilled At</small><strong>${order.fulfilled_at ? new Date(order.fulfilled_at).toLocaleString() : "Not fulfilled"}</strong></div>
  `;

  statusSelect.value = order.fulfillment_status || "pending";
  notes.value = order.fulfillment_notes || "";
  statusText.textContent = "";
  modal.dataset.orderId = order.id;
}

async function saveOrderFulfillment() {
  const modal = document.getElementById("order-modal");
  const statusSelect = document.getElementById("order-fulfillment-status");
  const notes = document.getElementById("order-fulfillment-notes");
  const statusText = document.getElementById("order-fulfillment-status-text");
  if (!modal || !statusSelect || !notes || !statusText) return;

  const orderId = modal.dataset.orderId;
  statusText.textContent = "Saving...";

  try {
    const res = await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: orderId,
        fulfillment_status: statusSelect.value,
        fulfillment_notes: notes.value.trim(),
      }),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      statusText.textContent = data.error || "Unable to save order.";
      return;
    }

    statusText.textContent = "Order updated.";
    await loadOrders();
    populateOrderModal(data.order);
  } catch (error) {
    console.error(error);
    statusText.textContent = "Unable to save order. Check console.";
  }
}

// MESSAGES
async function loadMessages() {
  const res = await fetch("/api/messages");
  const data = await res.json();
  const messages = data.messages || [];
  const container = document.getElementById("messages-container");
  const status = document.getElementById("messages-status");
  if (container) container.innerHTML = "";
  status.textContent = "Refreshing messages...";

  if (!res.ok) {
    container.innerHTML = '<div class="message-box">Unable to load messages.</div>';
    status.textContent = "Unable to load messages.";
    return;
  }

  if (!messages.length) {
    container.innerHTML = '<div class="message-box">No messages found.</div>';
    status.textContent = "No messages found.";
    return;
  }

  messages.forEach((m) => {
    const box = document.createElement("div");
    box.className = "message-box";
    box.innerHTML = `
      <strong>${m.name || "Anonymous"}</strong><br>
      <span style="color:${m.color || '#fff'}; font-family:${m.font || 'Arial'};">${m.message || ""}</span><br>
      <small>${new Date(m.created_at).toLocaleString()}</small>
    `;
    container.appendChild(box);
  });

  status.textContent = `Loaded ${messages.length} message${messages.length === 1 ? "" : "s"}.`;
}

// GALLERY
async function uploadGalleryFile() {
  const uploadButton = document.getElementById("upload-btn");
  const uploadInput = document.getElementById("gallery-upload");
  const galleryCategory = document.getElementById("gallery-category");
  const status = document.getElementById("gallery-status");

  uploadButton.addEventListener("click", async () => {
    const file = uploadInput.files[0];
    if (!file) {
      alert("Please choose a file before uploading.");
      return;
    }

    status.textContent = "Uploading...";

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", galleryCategory.value || "memories");
      const response = await fetch("/api/gallery", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        status.textContent = "Upload successful!";
        uploadInput.value = "";
        await Promise.all([loadGallery(), loadGalleryAdmin()]);
      } else {
        status.textContent = result.error || "Upload failed.";
      }
    } catch (error) {
      console.error(error);
      status.textContent = "Upload failed. Check console.";
    }
  });
}

async function loadGallery() {
  const res = await fetch("/api/gallery");
  const items = await res.json();
  const container = document.getElementById("gallery-items");
  const status = document.getElementById("gallery-status");

  container.innerHTML = "";
  status.textContent = "Refreshing gallery...";

  const galleryItems = Array.isArray(items) ? items : items.items || [];
  if (!galleryItems.length) {
    container.innerHTML = '<div class="message-box">No gallery images found.</div>';
    status.textContent = "No gallery images found.";
    return;
  }

  galleryItems.forEach((item) => {
    const imageUrl = resolveGalleryImageUrl(item);
    const card = document.createElement("div");
    card.className = "message-box";
    card.style.display = "flex";
    card.style.alignItems = "center";
    card.style.gap = "12px";
    card.innerHTML = `
      <img src="${imageUrl}" alt="${item.original_name || 'Uploaded'}" style="width:96px; height:auto; border-radius:12px; object-fit:cover;" />
      <div>
        <strong>${item.original_name || 'Uploaded image'}</strong><br />
        <small>${new Date(item.uploaded_at).toLocaleString()}</small>
      </div>
    `;
    container.appendChild(card);
  });

  status.textContent = `Loaded ${galleryItems.length} gallery item${galleryItems.length === 1 ? "" : "s"}.`;
}

async function loadGalleryAdmin() {
  const res = await fetch("/api/gallery");
  const items = await res.json();
  const container = document.getElementById("gallery-admin");
  const galleryItems = Array.isArray(items) ? items : items.items || [];

  container.innerHTML = "";
  if (!galleryItems.length) {
    container.innerHTML = '<div class="message-box">No gallery uploads yet.</div>';
    return;
  }

  galleryItems.forEach((item) => {
    const imageUrl = resolveGalleryImageUrl(item);
    const div = document.createElement("div");
    div.className = "gallery-item";
    div.innerHTML = `
      <img src="${imageUrl}" alt="${item.original_name || 'Uploaded'}" />
      <div style="flex:1;">
        <p><strong>${item.original_name || 'Uploaded image'}</strong></p>
        <p style="margin:6px 0 0; color:#aaa;">${item.category || 'memories'}</p>
      </div>
      <button data-id="${item.id}" class="delete-btn">Delete</button>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!confirm("Delete this gallery item?")) return;
      await fetch(`/api/gallery?id=${id}`, { method: "DELETE" });
      await Promise.all([loadGallery(), loadGalleryAdmin()]);
    });
  });
}

function resolveGalleryImageUrl(item) {
  if (!item) return "";
  if (item.image_url) return item.image_url;
  if (item.filename && /^https?:\/\//i.test(item.filename)) return item.filename;
  if (item.filename) return `/remembrance/Stand_Still_photos/${item.filename}`;
  return "";
}

// PRODUCTS
async function loadProducts() {
  const res = await fetch("/api/products");
  const data = await res.json();
  const products = Array.isArray(data.products) ? data.products : [];
  renderProductsTable(products);
}

function renderProductsTable(products) {
  const tbody = document.querySelector("#products-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="5">No products available.</td></tr>';
    return;
  }

  products.forEach((product) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${product.id}</td>
      <td>${product.name || "Untitled"}</td>
      <td>${formatCurrency(product.price)}</td>
      <td>${product.active ? "Yes" : "No"}</td>
      <td>
        <button class="action-btn edit-product-btn" data-id="${product.id}">Edit</button>
        <button class="action-btn delete-product-btn" data-id="${product.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  attachProductListeners();
}

function attachProductListeners() {
  document.querySelectorAll(".edit-product-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        fillProductForm(data.product);
      }
    });
  });

  document.querySelectorAll(".delete-product-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      if (!confirm("Delete this product?")) return;
      await deleteProduct(id);
    });
  });
}

function fillProductForm(product) {
  document.getElementById("prod-id").value = product.id || "";
  document.getElementById("prod-name").value = product.name || "";
  document.getElementById("prod-desc").value = product.description || "";
  document.getElementById("prod-price").value = Number(product.price || 0).toFixed(2);
  document.getElementById("prod-category").value = product.category || "";
  document.getElementById("prod-image-url").value = product.image_url || "";
  document.getElementById("prod-active").checked = product.active !== false;
  document.getElementById("prod-status").textContent = `Editing product ${product.id}`;
}

async function saveProduct() {
  const id = document.getElementById("prod-id").value.trim();
  const name = document.getElementById("prod-name").value.trim();
  const description = document.getElementById("prod-desc").value.trim();
  const price = parseFloat(document.getElementById("prod-price").value);
  const category = document.getElementById("prod-category").value.trim();
  const imageUrl = document.getElementById("prod-image-url").value.trim();
  const active = document.getElementById("prod-active").checked;
  const status = document.getElementById("prod-status");

  if (!name || Number.isNaN(price)) {
    status.textContent = "Please provide a name and valid price.";
    return;
  }

  status.textContent = "Saving product...";

  const body = {
    name,
    description,
    price,
    category,
    image_url: imageUrl || null,
    active,
  };
  const url = id ? `/api/products?id=${encodeURIComponent(id)}` : "/api/products";
  const method = id ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      status.textContent = data.error || "Unable to save product.";
      return;
    }

    resetProductForm();
    status.textContent = `Product ${id ? "updated" : "created"} successfully.`;
    await loadProducts();
  } catch (error) {
    console.error(error);
    status.textContent = "Unable to save product. Check console.";
  }
}

function resetProductForm() {
  document.getElementById("prod-id").value = "";
  document.getElementById("prod-name").value = "";
  document.getElementById("prod-desc").value = "";
  document.getElementById("prod-price").value = "0.00";
  document.getElementById("prod-category").value = "";
  document.getElementById("prod-image-url").value = "";
  document.getElementById("prod-active").checked = true;
  document.getElementById("prod-status").textContent = "";
}

async function deleteProduct(id) {
  const status = document.getElementById("prod-status");
  status.textContent = "Deleting product...";
  try {
    const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || !data.success) {
      status.textContent = data.error || "Unable to delete product.";
      return;
    }
    status.textContent = "Product deleted.";
    await loadProducts();
  } catch (error) {
    console.error(error);
    status.textContent = "Unable to delete product. Check console.";
  }
}

function formatCurrency(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `$${number.toFixed(2)}` : "$0.00";
}

const orderModal = document.getElementById("order-modal");
const orderModalClose = document.getElementById("order-modal-close");

if (orderModalClose) {
  orderModalClose.addEventListener("click", closeOrderModal);
}

if (orderModal) {
  orderModal.addEventListener("click", (event) => {
    if (event.target === orderModal) {
      closeOrderModal();
    }
  });
}

const orderSaveBtn = document.getElementById("order-fulfillment-save");
if (orderSaveBtn) {
  orderSaveBtn.addEventListener("click", saveOrderFulfillment);
}

const refreshOrdersButton = document.getElementById("refresh-orders");
if (refreshOrdersButton) {
  refreshOrdersButton.addEventListener("click", loadOrders);
}

const refreshMessagesButton = document.getElementById("refresh-messages");
if (refreshMessagesButton) {
  refreshMessagesButton.addEventListener("click", loadMessages);
}

const refreshGalleryButton = document.getElementById("refresh-gallery");
if (refreshGalleryButton) {
  refreshGalleryButton.addEventListener("click", () => {
    loadGallery();
    loadGalleryAdmin();
  });
}

const saveProductBtn = document.getElementById("prod-save");
if (saveProductBtn) {
  saveProductBtn.addEventListener("click", saveProduct);
}

// INITIAL LOAD
loadOrders();
loadMessages();
loadGallery();
loadGalleryAdmin();
uploadGalleryFile();
loadProducts();
