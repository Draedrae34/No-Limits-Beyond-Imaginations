// TAB SWITCHING
const tabs = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".panel");

tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("active"));
    panels.forEach(p => p.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// LOAD ORDERS
async function loadOrders() {
  const res = await fetch("/api/orders");
  const data = await res.json();
  const orders = Array.isArray(data) ? data : data.orders || [];

  const tbody = document.querySelector("#orders-table tbody");
  const status = document.getElementById("orders-status");
  tbody.innerHTML = "";
  status.textContent = "Refreshing orders...";

  if (!Array.isArray(orders) || !orders.length) {
    tbody.innerHTML = '<tr><td colspan="6">No orders found.</td></tr>';
    status.textContent = orders.length === 0 ? "No orders found." : "Unable to load orders.";
    return;
  }

  orders.forEach(o => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${o.id}</td>
      <td>${o.product_id || "N/A"}</td>
      <td>$${o.amount ?? "0.00"}</td>
      <td>${o.buyer_name || "Unknown"}</td>
      <td>${o.buyer_email || "Unknown"}</td>
      <td>${new Date(o.created_at).toLocaleString()}</td>
    `;
    tbody.appendChild(row);
  });
  status.textContent = `Loaded ${orders.length} order${orders.length === 1 ? "" : "s"}.`;
}

// LOAD MESSAGES
async function loadMessages() {
  const res = await fetch("/api/messages");
  const messages = await res.json();

  const container = document.getElementById("messages-container");
  const status = document.getElementById("messages-status");
  container.innerHTML = "";
  status.textContent = "Refreshing messages...";

  if (!Array.isArray(messages)) {
    container.innerHTML = '<div class="message-box">Unable to load messages.</div>';
    status.textContent = "Unable to load messages.";
    return;
  }

  if (messages.length === 0) {
    container.innerHTML = '<div class="message-box">No messages found.</div>';
    status.textContent = "No messages found.";
    return;
  }

  messages.forEach(m => {
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

// GALLERY UPLOAD
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
    const card = document.createElement("div");
    card.className = "message-box";
    card.style.display = "flex";
    card.style.alignItems = "center";
    card.style.gap = "12px";
    card.innerHTML = `
      <img src="/remembrance/Stand_Still_photos/${item.filename}" alt="${item.original_name || 'Uploaded'}" style="width:96px; height:auto; border-radius:12px; object-fit:cover;" />
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
    const div = document.createElement("div");
    div.className = "gallery-item";
    div.innerHTML = `
      <img src="/remembrance/Stand_Still_photos/${item.filename}" alt="${item.original_name || 'Uploaded'}" />
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
      await fetch("/api/gallery", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      await Promise.all([loadGallery(), loadGalleryAdmin()]);
    });
  });
}

// INITIAL LOAD
loadOrders();
loadMessages();
loadGallery();
loadGalleryAdmin();
uploadGalleryFile();

document.getElementById("refresh-orders").addEventListener("click", loadOrders);
document.getElementById("refresh-messages").addEventListener("click", loadMessages);
document.getElementById("refresh-gallery").addEventListener("click", () => {
  loadGallery();
  loadGalleryAdmin();
});
