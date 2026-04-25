document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const loginForm = document.getElementById('login-form');
  const loginStatus = document.getElementById('login-status');
  const logoutButton = document.getElementById('logout-button');
  const navOrders = document.getElementById('nav-orders');
  const navMessages = document.getElementById('nav-messages');
  const navGallery = document.getElementById('nav-gallery');
  const ordersPanel = document.getElementById('orders-panel');
  const messagesPanel = document.getElementById('messages-panel');
  const galleryPanel = document.getElementById('gallery-panel');
  const ordersCount = document.getElementById('orders-count');
  const messagesCount = document.getElementById('messages-count');
  const galleryCount = document.getElementById('gallery-count');
  const ordersTable = document.getElementById('orders-table');
  const messagesList = document.getElementById('messages-list');
  const galleryForm = document.getElementById('gallery-form');
  const galleryStatus = document.getElementById('gallery-status');
  const galleryList = document.getElementById('gallery-list');

  const storageKey = 'nlbl_workshop_authenticated';

  function showSection(sectionId) {
    ordersPanel.classList.toggle('hidden', sectionId !== 'orders');
    messagesPanel.classList.toggle('hidden', sectionId !== 'messages');
    galleryPanel.classList.toggle('hidden', sectionId !== 'gallery');
    navOrders.classList.toggle('active', sectionId === 'orders');
    navMessages.classList.toggle('active', sectionId === 'messages');
    navGallery.classList.toggle('active', sectionId === 'gallery');
  }

  async function fetchOrders() {
    const response = await fetch('/api/orders');
    const data = await response.json();
    if (!data.success) {
      ordersTable.innerHTML = '<tr><td colspan="7">Unable to load orders.</td></tr>';
      return;
    }

    ordersCount.textContent = data.orders.length;
    ordersTable.innerHTML = data.orders
      .map(
        (order) => `
        <tr>
          <td>${order.id}</td>
          <td>${order.paypal_order_id}</td>
          <td>${order.product_id ?? '—'}</td>
          <td>${order.amount ?? '—'}</td>
          <td>${order.buyer_name ?? 'Unknown'}</td>
          <td>${order.buyer_email ?? 'Unknown'}</td>
          <td>${new Date(order.created_at).toLocaleString()}</td>
        </tr>`
      )
      .join('');
  }

  async function fetchMessages() {
    const response = await fetch('/api/messages');
    const messages = await response.json();
    messagesCount.textContent = Array.isArray(messages) ? messages.length : 0;

    if (!Array.isArray(messages)) {
      messagesList.innerHTML = '<p>Unable to load messages.</p>';
      return;
    }

    messagesList.innerHTML = messages
      .slice(0, 12)
      .map(
        (message) => `
        <div class="message-card">
          <h3>${message.name || 'Anonymous'}</h3>
          <p>${message.message || ''}</p>
          <small>${new Date(message.created_at).toLocaleString()}</small>
        </div>`
      )
      .join('');
  }

  async function fetchGallery() {
    const response = await fetch('/api/gallery');
    const result = await response.json();
    const items = result.items || [];
    galleryCount.textContent = items.length;

    galleryList.innerHTML = items
      .map(
        (item) => `
        <div class="gallery-card">
          <h3>${item.title}</h3>
          <p>${new Date(item.created_at).toLocaleString()}</p>
          <img src="${item.imageUrl}" alt="${item.title}" style="width:100%;border-radius:16px;margin-top:0.75rem;" />
        </div>`
      )
      .join('');
  }

  async function authenticate(password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      return response.json();
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Login request failed.' };
    }
  }

  async function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    await Promise.all([fetchOrders(), fetchMessages(), fetchGallery()]);
  }

  function showLogin() {
    dashboardSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
  }

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginStatus.textContent = 'Authenticating...';
    const password = document.getElementById('admin-password').value;
    const result = await authenticate(password);
    if (result.success) {
      localStorage.setItem(storageKey, 'true');
      loginStatus.textContent = 'Authenticated. Loading workshop...';
      await showDashboard();
    } else {
      loginStatus.textContent = result.message || 'Invalid password.';
    }
  });

  logoutButton?.addEventListener('click', () => {
    localStorage.removeItem(storageKey);
    showLogin();
  });

  navOrders?.addEventListener('click', () => showSection('orders'));
  navMessages?.addEventListener('click', () => showSection('messages'));
  navGallery?.addEventListener('click', () => showSection('gallery'));

  galleryForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    galleryStatus.textContent = 'Saving gallery item...';
    const title = document.getElementById('gallery-title').value.trim();
    const imageUrl = document.getElementById('gallery-url').value.trim();

    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, imageUrl }),
      });
      const data = await response.json();
      if (data.success) {
        galleryStatus.textContent = 'Gallery item saved.';
        galleryForm.reset();
        await fetchGallery();
      } else {
        galleryStatus.textContent = data.error || 'Unable to save gallery item.';
      }
    } catch (error) {
      console.error(error);
      galleryStatus.textContent = 'Request failed. Check console.';
    }
  });

  if (localStorage.getItem(storageKey) === 'true') {
    showDashboard();
  } else {
    showLogin();
  }
});
