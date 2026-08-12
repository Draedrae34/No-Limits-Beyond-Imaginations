(function () {
  const ADMIN_TOKEN_KEY = 'ADMIN_API_TOKEN';

  async function apiRequest(endpoint, options = {}) {
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY) || '';
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }

    try {
      const response = await fetch(endpoint, {
        credentials: 'include',
        ...options,
        headers,
      });

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! Status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`[LilMystic] API Call Failed (${endpoint}):`, error.message);
      throw error;
    }
  }

  async function notify(message, type = 'info') {
    if (window.UI && typeof window.UI.showNotification === 'function') {
      window.UI.showNotification(message, type);
      return;
    }
    console.log(`[LilMystic] ${type.toUpperCase()}: ${message}`);
  }

  async function syncCatalog() {
    console.log('[LilMystic] Triggering Catalog Sync...');
    try {
      const result = await apiRequest('/api/shop?action=printifyAdmin&printifyAction=sync', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      console.log('[LilMystic] Catalog synced successfully:', result);
      await refreshWorkshopProducts();
      await notify('Catalog synchronized successfully!', 'success');
      return result;
    } catch (err) {
      alert(`Catalog sync failed: ${err.message}`);
      await notify(`Catalog sync failed: ${err.message}`, 'error');
    }
  }

  async function publishProduct(productId) {
    if (!productId) {
      throw new Error('productId is required to publish a product.');
    }

    console.log(`[LilMystic] Publishing product ${productId}...`);
    try {
      const result = await apiRequest(`/api/shop?action=printifyAdmin&printifyAction=publish&productId=${encodeURIComponent(productId)}`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      console.log('[LilMystic] Product published:', result);
      await refreshWorkshopProducts();
      await notify('Product published successfully!', 'success');
      return result;
    } catch (err) {
      alert(`Publishing failed: ${err.message}`);
      await notify(`Publishing failed: ${err.message}`, 'error');
    }
  }

  async function refreshWorkshopProducts() {
    if (typeof window.loadProducts === 'function') {
      await window.loadProducts();
      return;
    }
    if (window.WorkshopStore && typeof window.WorkshopStore.reloadProducts === 'function') {
      await window.WorkshopStore.reloadProducts();
    }
  }

  async function generateAndApplyDesign() {
    const promptInput = document.getElementById('ws-design-prompt');
    const promptValue = promptInput?.value?.trim() || '';
    if (!window.generateDesignIdeas) {
      throw new Error('Workshop design generation is not available.');
    }

    await window.generateDesignIdeas();

    const ideas = (window.state?.studio?.generatedDesignIdeas || []).filter(Boolean);
    if (!ideas.length) {
      throw new Error('Design generation returned no concepts.');
    }

    if (promptInput && !promptValue) {
      promptInput.value = ideas[0];
    }

    const status = document.getElementById('design-export-status');
    if (status) {
      status.textContent = 'Lil Mystic has generated new design concepts. Review them below.';
    }

    return { ideas };
  }

  async function draftTrack() {
    if (!window.generateWorkshopBeat || !window.generateWorkshopLyrics || !window.composeWorkshopSong) {
      throw new Error('Workshop music tools are not available.');
    }

    await window.generateWorkshopBeat();
    await window.generateWorkshopLyrics();
    await window.composeWorkshopSong();

    const output = document.getElementById('ws-music-output');
    const title = document.getElementById('ws-music-title')?.value?.trim() || 'Untitled Track';

    const summary = {
      title,
      beat: window.state?.studio?.generatedBeat || '',
      lyrics: window.state?.studio?.generatedLyrics || '',
      composition: window.state?.studio?.composedSong || output?.textContent || '',
    };

    return summary;
  }

  async function publishDesignToShop() {
    if (!window.saveDesignConcept) {
      throw new Error('Workshop save design functionality is not available.');
    }

    const status = document.getElementById('design-export-status');
    if (status) {
      status.textContent = 'Publishing your design concept to the shop...';
    }

    await generateAndApplyDesign();
    await window.saveDesignConcept(document.getElementById('ws-design-save-btn') || null);
    await syncCatalog();

    if (status) {
      status.textContent = 'Design concept published and catalog refreshed.';
    }

    return { published: true };
  }

  function init() {
    const syncBtn = document.getElementById('mystic-sync-catalog-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await WorkshopUI.runAction(
          syncBtn,
          () => syncCatalog(),
          'Connecting to Printify API & rebuilding catalog cache...',
          'Printify catalog synchronized and database cache updated!'
        );
      });
    }

    const publishBtn = document.getElementById('mystic-publish-product-btn');
    if (publishBtn) {
      publishBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const productIdInput = document.getElementById('prod-id');
        const productId = productIdInput?.value?.trim();
        if (!productId) {
          alert('No product selected to publish. Load a product first or save a new product.');
          return;
        }

        await WorkshopUI.runAction(
          publishBtn,
          () => publishProduct(productId),
          `Publishing Product ID ${productId} to live storefront...`,
          'Product successfully published to store!'
        );
      });
    }
  }

  const LilMysticBridge = {
    generateAndApplyDesign,
    draftTrack,
    publishDesignToShop,
  };

  const LilMysticActions = {
    apiRequest,
    actions: {
      syncCatalog,
      publishProduct,
    },
    bridge: LilMysticBridge,
    init,
  };

  window.LilMysticActions = LilMysticActions;
  window.LilMysticBridge = LilMysticBridge;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
