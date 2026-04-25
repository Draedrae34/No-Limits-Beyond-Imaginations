// Tab Navigation
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    const panelId = btn.dataset.tab;
    document.getElementById(panelId).classList.add("active");

    if (panelId === "products") loadProducts();
  });
});

// Product Management
async function loadProducts() {
  const res = await fetch("/api/products");
  const data = await res.json();
  if (!data.success) return;

  const tbody = document.querySelector("#products-table tbody");
  tbody.innerHTML = "";

  data.products.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>$${p.price}</td>
      <td>${p.active ? "Yes" : "No"}</td>
      <td>
        <button data-id="${p.id}" class="prod-edit">Edit</button>
        <button data-id="${p.id}" class="prod-delete" style="background:#ff3b3b; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".prod-edit").forEach((btn) => {
    btn.onclick = () => editProduct(btn.dataset.id);
  });
  document.querySelectorAll(".prod-delete").forEach((btn) => {
    btn.onclick = () => deleteProduct(btn.dataset.id);
  });
}

async function editProduct(id) {
  const res = await fetch(`/api/products/${id}`);
  const data = await res.json();
  if (!data.success) return;

  const p = data.product;
  document.getElementById("prod-id").value = p.id;
  document.getElementById("prod-name").value = p.name;
  document.getElementById("prod-desc").value = p.description || "";
  document.getElementById("prod-price").value = p.price;
  document.getElementById("prod-category").value = p.category || "";
  document.getElementById("prod-active").checked = !!p.active;
  document.getElementById("prod-status").textContent = `Editing product #${p.id}`;
  document.getElementById("products").scrollTop = 0;
}

async function deleteProduct(id) {
  if (!confirm("Delete this product permanently?")) return;
  await fetch(`/api/products/${id}`, { method: "DELETE" });
  loadProducts();
}

document.getElementById("prod-save").addEventListener("click", async () => {
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

  let image_filename = null;
  if (fileInput.files[0]) {
    statusEl.textContent = "Uploading image...";
    const fd = new FormData();
    fd.append("file", fileInput.files[0]);
    const uploadRes = await fetch("/api/product-upload", { method: "POST", body: fd });
    const uploadData = await uploadRes.json();
    if (!uploadData.success) {
      statusEl.textContent = "Image upload failed.";
      return;
    }
    image_filename = uploadData.url || uploadData.filename;
  }

  const payload = { name, description, price, category, active };
  if (image_filename) payload.image_filename = image_filename;

  const method = id ? "PUT" : "POST";
  const url = id ? `/api/products/${id}` : "/api/products";

  statusEl.textContent = "Saving...";
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.success) {
    statusEl.textContent = "Product saved successfully.";
    document.getElementById("prod-id").value = "";
    fileInput.value = "";
    loadProducts();
  } else {
    statusEl.textContent = data.error || "Save failed.";
  }
});
