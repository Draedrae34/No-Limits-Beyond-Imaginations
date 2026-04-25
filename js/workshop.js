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
  const orders = await res.json();

  const tbody = document.querySelector("#orders-table tbody");
  tbody.innerHTML = "";

  if (!Array.isArray(orders)) {
    tbody.innerHTML = '<tr><td colspan="6">Unable to load orders.</td></tr>';
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
}

// LOAD MESSAGES
async function loadMessages() {
  const res = await fetch("/api/messages");
  const messages = await res.json();

  const container = document.getElementById("messages-container");
  container.innerHTML = "";

  if (!Array.isArray(messages)) {
    container.innerHTML = '<div class="message-box">Unable to load messages.</div>';
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
}

// GALLERY UPLOAD PLACEHOLDER
function setupGalleryUpload() {
  const uploadButton = document.getElementById("upload-btn");
  const uploadInput = document.getElementById("gallery-upload");

  uploadButton.addEventListener("click", () => {
    if (!uploadInput.files.length) {
      alert("Please choose a file before uploading.");
      return;
    }

    alert("Gallery upload is a placeholder for now. Backend wiring coming next.");
  });
}

// INITIAL LOAD
loadOrders();
loadMessages();
setupGalleryUpload();
