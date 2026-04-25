const state = {
  orders: [],
  activeOrderId: null,
};

const tabs = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".panel");

tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabs.forEach((tab) => tab.classList.remove("active"));
    panels.forEach((panel) => panel.classList.remove("active"));

    btn.classList.add("active");
    const panelId = btn.dataset.tab;
    document.getElementById(panelId)?.classList.add("active");

    if (panelId === "products") loadProducts();
    if (panelId === "orders") loadOrders();
    if (panelId === "messages") loadMessages();
    if (panelId === "gallery") {
      loadGallery();
      loadGalleryAdmin();
    }
  });
});

function formatCurrency(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return "$0.00";
  return `$${number.toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function resolveProductImageUrl(product) {
  if (!product) return "/placeholder-product.png";
  const imageUrl = product.image_url || product.image_filename || "";
  if (!imageUrl) return "/placeholder-product.png";
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith("/")) return imageUrl;
  return `/products/${imageUrl}`;
}

function resolveGalleryImageUrl(item) {
  if (!item) return "";
  if (item.image_url) return item.image_url;
  if (item.filename && /^https?:\/\//i.test(item.filename)) return item.filename;
  if (item.filename) return `/remembrance/Stand_Still_photos/${item.filename}`;
  return "";
}

async function loadOrders() {
  const tbody = document.querySelector("#orders-table tbody");
  const statusEl = document.getElementById("orders-status");
  if (!tbody || !statusEl) return;

  statusEl.textContent = "Refreshing orders...";
  tbody.innerHTML = "";

  try {
    const res = await fetch("/api/orders");
    const data = await res.json();
    const orders = Array.isArray(data) ? data : data.orders || [];
    state.orders = orders;

    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="8">No orders found.</td></tr>';
      statusEl.textContent = "No orders found.";
      return;
    }

    orders.forEach((order) => {
      const status = order.fulfillment_status === "fulfilled" ? "Fulfilled" : "Pending";
      const nextStatus = order.fulfillment_status === "fulfilled" ? "pending" : "fulfilled";
      const toggleLabel = nextStatus === "fulfilled" ? "Mark Fulfilled" : "Mark Pending";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${order.id}</td>
        <td>${order.product_id || "N/A"}</td>
        <td>${formatCurrency(order.amount)}</td>
        <td>${order.buyer_name || "Unknown"}</td>
        <td>${order.buyer_email || "Unknown"}</td>
        <td>${status}</td>
        <td>${formatDate(order.created_at)}</td>
        <td>
          <button class="action-btn order-detail-btn" data-id="${order.id}">Details</button>
          <button class="action-btn order-toggle-btn" data-id="${order.id}" data-next-status="${nextStatus}">
            ${toggleLabel}
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    tbody.querySelectorAll(".order-detail-btn").forEach((btn) => {
      btn.addEventListener("click", () => openOrderModal(Number(btn.dataset.id)));
    });

    tbody.querySelectorAll(".order-toggle-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const orderId = Number(btn.dataset.id);
        const nextStatus = btn.dataset.nextStatus || "pending";
        const order = state.orders.find((item) => Number(item.id) === orderId);
        await updateOrderFulfillment(orderId, nextStatus, order?.fulfillment_notes || "");
      });
    });

    statusEl.textContent = `Loaded ${orders.length} order${orders.length === 1 ? "" : "s"}.`;
  } catch (error) {
    console.error(error);
    tbody.innerHTML = '<tr><td colspan="8">Unable to load orders.</td></tr>';
    statusEl.textContent = "Unable to load orders.";
  }
}

function openOrderModal(orderId) {
  const modal = document.getElementById("order-modal");
  const title = document.getElementById("order-modal-title");
  const grid = document.getElementById("order-detail-grid");
  const notesInput = document.getElementById("order-fulfillment-notes");
  const statusSelect = document.getElementById("order-fulfillment-status");
  const saveStatus = document.getElementById("order-fulfillment-status-text");
  if (!modal || !title || !grid || !notesInput || !statusSelect || !saveStatus) return;

  const order = state.orders.find((item) => Number(item.id) === Number(orderId));
  if (!order) return;

  state.activeOrderId = Number(orderId);
  title.textContent = `Order #${order.id}`;
  grid.innerHTML = `
    <div><small>Order ID</small>${order.id}</div>
    <div><small>PayPal Order ID</small>${order.paypal_order_id || "N/A"}</div>
    <div><small>Product</small>${order.product_id || "N/A"}</div>
    <div><small>Amount</small>${formatCurrency(order.amount)}</div>
    <div><small>Buyer</small>${order.buyer_name || "Unknown"}</div>
    <div><small>Email</small>${order.buyer_email || "Unknown"}</div>
    <div><small>Created</small>${formatDate(order.created_at)}</div>
    <div><small>Fulfilled At</small>${formatDate(order.fulfilled_at)}</div>
  `;
  notesInput.value = order.fulfillment_notes || "";
  statusSelect.value = order.fulfillment_status === "fulfilled" ? "fulfilled" : "pending";
  saveStatus.textContent = "";
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function closeOrderModal() {
  const modal = document.getElementById("order-modal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  state.activeOrderId = null;
}

async function updateOrderFulfillment(orderId, fulfillmentStatus, fulfillmentNotes) {
  const statusEl = document.getElementById("orders-status");
  const modalStatus = document.getElementById("order-fulfillment-status-text");

  try {
    if (statusEl) statusEl.textContent = "Saving fulfillment update...";
    if (modalStatus) modalStatus.textContent = "Saving...";

    const response = await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: orderId,
        fulfillment_status: fulfillmentStatus,
        fulfillment_notes: fulfillmentNotes,
      }),
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Fulfillment update failed");
    }

    if (modalStatus) modalStatus.textContent = "Saved.";
    await loadOrders();

    if (state.activeOrderId === Number(orderId)) {
      openOrderModal(orderId);
    }
  } catch (error) {
    console.error(error);
    if (statusEl) statusEl.textContent = error.message || "Unable to update fulfillment.";
    if (modalStatus) modalStatus.textContent = error.message || "Unable to save.";
  }
}

async function loadMessages() {
  const container = document.getElementById("messages-container");
  const statusEl = document.getElementById("messages-status");
  if (!container || !statusEl) return;

  container.innerHTML = "";
  statusEl.textContent = "Refreshing messages...";

  try {
    const res = await fetch("/api/messages");
    const messages = await res.json();
    if (!Array.isArray(messages)) {
      container.innerHTML = '<div class="message-box">Unable to load messages.</div>';
      statusEl.textContent = "Unable to load messages.";
      return;
    }

    if (!messages.length) {
      container.innerHTML = '<div class="message-box">No messages found.</div>';
      statusEl.textContent = "No messages found.";
      return;
    }

    messages.forEach((message) => {
      const box = document.createElement("div");
      box.className = "message-box";
      box.innerHTML = `
        <strong>${message.name || "Anonymous"}</strong><br>
        <span style="color:${message.color || "#fff"}; font-family:${message.font || "Arial"};">
          ${message.message || ""}
        </span><br>
        <small>${formatDate(message.created_at)}</small>
      `;
      container.appendChild(box);
    });

    statusEl.textContent = `Loaded ${messages.length} message${messages.length === 1 ? "" : "s"}.`;
  } catch (error) {
    console.error(error);
    container.innerHTML = '<div class="message-box">Unable to load messages.</div>';
    statusEl.textContent = "Unable to load messages.";
  }
}

function uploadGalleryFile() {
  const uploadButton = document.getElementById("upload-btn");
  const uploadInput = document.getElementById("gallery-upload");
  const galleryCategory = document.getElementById("gallery-category");
  const statusEl = document.getElementById("gallery-status");
  if (!uploadButton || !uploadInput || !galleryCategory || !statusEl) return;

  uploadButton.addEventListener("click", async () => {
    const file = uploadInput.files[0];
    if (!file) {
      statusEl.textContent = "Please choose a file first.";
      return;
    }

    statusEl.textContent = "Uploading...";
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", galleryCategory.value || "memories");

      const response = await fetch("/api/gallery", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!result.success) {
        statusEl.textContent = result.error || "Upload failed.";
        return;
      }

      statusEl.textContent = "Upload successful.";
      uploadInput.value = "";
      await Promise.all([loadGallery(), loadGalleryAdmin()]);
    } catch (error) {
      console.error(error);
      statusEl.textContent = "Upload failed.";
    }
  });
}

async function loadGallery() {
  const container = document.getElementById("gallery-items");
  const statusEl = document.getElementById("gallery-status");
  if (!container || !statusEl) return;

  container.innerHTML = "";
  statusEl.textContent = "Refreshing gallery...";

  try {
    const res = await fetch("/api/gallery");
    const items = await res.json();
    const galleryItems = Array.isArray(items) ? items : items.items || [];

    if (!galleryItems.length) {
      container.innerHTML = '<div class="message-box">No gallery images found.</div>';
      statusEl.textContent = "No gallery images found.";
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
        <img src="${imageUrl}" alt="${item.original_name || "Uploaded"}"
          style="width:96px; height:auto; border-radius:12px; object-fit:cover;" />
        <div>
          <strong>${item.original_name || "Uploaded image"}</strong><br />
          <small>${formatDate(item.uploaded_at)}</small>
        </div>
      `;
      container.appendChild(card);
    });

    statusEl.textContent = `Loaded ${galleryItems.length} gallery item${galleryItems.length === 1 ? "" : "s"}.`;
  } catch (error) {
    console.error(error);
    container.innerHTML = '<div class="message-box">Unable to load gallery images.</div>';
    statusEl.textContent = "Unable to load gallery.";
  }
}

async function loadGalleryAdmin() {
  const container = document.getElementById("gallery-admin");
  if (!container) return;

  container.innerHTML = "";
  try {
    const res = await fetch("/api/gallery");
    const items = await res.json();
    const galleryItems = Array.isArray(items) ? items : items.items || [];

    if (!galleryItems.length) {
      container.innerHTML = '<div class="message-box">No gallery uploads yet.</div>';
      return;
    }

    galleryItems.forEach((item) => {
      const imageUrl = resolveGalleryImageUrl(item);
      const card = document.createElement("div");
      card.className = "gallery-item";
      card.innerHTML = `
        <img src="${imageUrl}" alt="${item.original_name || "Uploaded"}" />
        <div style="flex:1;">
          <p><strong>${item.original_name || "Uploaded image"}</strong></p>
          <p style="margin:6px 0 0; color:#aaa;">${item.category || "memories"}</p>
        </div>
        <button data-id="${item.id}" class="delete-btn">Delete</button>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await fetch("/api/gallery", {
          method: "DELETE",
          body: JSON.stringify({ id: btn.dataset.id }),
        });
        await Promise.all([loadGallery(), loadGalleryAdmin()]);
      });
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = '<div class="message-box">Unable to load gallery uploads.</div>';
  }
}

async function loadProducts() {
  const tbody = document.querySelector("#products-table tbody");
  if (!tbody) return;

  try {
    const res = await fetch("/api/products");
    const data = await res.json();
    if (!data.success) return;

    tbody.innerHTML = "";
    data.products.forEach((product) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${product.id}</td>
        <td>${product.name}</td>
        <td>${formatCurrency(product.price)}</td>
        <td>${product.active ? "Yes" : "No"}</td>
        <td>
          <button data-id="${product.id}" class="prod-edit action-btn">Edit</button>
          <button data-id="${product.id}" class="prod-delete action-btn" style="background:#ff3b3b; border-color:#ff6b6b;">
            Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".prod-edit").forEach((btn) => {
      btn.addEventListener("click", () => editProduct(btn.dataset.id));
    });
    tbody.querySelectorAll(".prod-delete").forEach((btn) => {
      btn.addEventListener("click", () => deleteProduct(btn.dataset.id));
    });
  } catch (error) {
    console.error(error);
  }
}

async function editProduct(id) {
  const statusEl = document.getElementById("prod-status");
  try {
    const res = await fetch(`/api/products/${id}`);
    const data = await res.json();
    if (!data.success) {
      if (statusEl) statusEl.textContent = data.error || "Unable to load product.";
      return;
    }

    const product = data.product;
    document.getElementById("prod-id").value = product.id;
    document.getElementById("prod-name").value = product.name || "";
    document.getElementById("prod-desc").value = product.description || "";
    document.getElementById("prod-price").value = product.price ?? "";
    document.getElementById("prod-category").value = product.category || "";
    document.getElementById("prod-active").checked = !!product.active;
    if (statusEl) {
      statusEl.textContent = `Editing product #${product.id} (${resolveProductImageUrl(product)})`;
    }
  } catch (error) {
    console.error(error);
    if (statusEl) statusEl.textContent = "Unable to load product.";
  }
}

async function deleteProduct(id) {
  if (!confirm("Delete this product permanently?")) return;
  await fetch(`/api/products/${id}`, { method: "DELETE" });
  await loadProducts();
}

async function saveProduct() {
  const id = document.getElementById("prod-id").value;
  const name = document.getElementById("prod-name").value.trim();
  const description = document.getElementById("prod-desc").value.trim();
  const price = document.getElementById("prod-price").value;
  const category = document.getElementById("prod-category").value.trim();
  const active = document.getElementById("prod-active").checked;
  const fileInput = document.getElementById("prod-image");
  const statusEl = document.getElementById("prod-status");

  if (!name || !price) {
    statusEl.textContent = "Name and price are required.";
    return;
  }

  let imageUrl = null;
  if (fileInput.files[0]) {
    statusEl.textContent = "Uploading image...";
    const fd = new FormData();
    fd.append("file", fileInput.files[0]);

    const uploadRes = await fetch("/api/product-upload", { method: "POST", body: fd });
    const uploadData = await uploadRes.json();
    if (!uploadData.success) {
      statusEl.textContent = uploadData.error || "Image upload failed.";
      return;
    }
    imageUrl = uploadData.image_url || uploadData.url || uploadData.filename;
  }

  const payload = { name, description, price, category, active };
  if (imageUrl) payload.image_url = imageUrl;

  const method = id ? "PUT" : "POST";
  const url = id ? `/api/products/${id}` : "/api/products";

  statusEl.textContent = "Saving product...";
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) {
      statusEl.textContent = data.error || "Save failed.";
      return;
    }

    statusEl.textContent = "Product saved successfully.";
    document.getElementById("prod-id").value = "";
    fileInput.value = "";
    await loadProducts();
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Save failed.";
  }
}

function wireUiEvents() {
  document.getElementById("refresh-orders")?.addEventListener("click", loadOrders);
  document.getElementById("refresh-messages")?.addEventListener("click", loadMessages);
  document.getElementById("refresh-gallery")?.addEventListener("click", async () => {
    await Promise.all([loadGallery(), loadGalleryAdmin()]);
  });
  document.getElementById("prod-save")?.addEventListener("click", saveProduct);

  const modal = document.getElementById("order-modal");
  document.getElementById("order-modal-close")?.addEventListener("click", closeOrderModal);
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeOrderModal();
  });

  document.getElementById("order-fulfillment-save")?.addEventListener("click", async () => {
    if (!state.activeOrderId) return;
    const status = document.getElementById("order-fulfillment-status")?.value || "pending";
    const notes = document.getElementById("order-fulfillment-notes")?.value || "";
    await updateOrderFulfillment(state.activeOrderId, status, notes);
  });
}

async function initializeWorkshop() {
  wireUiEvents();
  uploadGalleryFile();
  await Promise.all([loadOrders(), loadMessages(), loadGallery(), loadGalleryAdmin()]);
}

initializeWorkshop();
