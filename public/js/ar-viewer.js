/**
 * NLBL AR Product Viewer
 * Web-based Augmented Reality for product preview
 */

class ARViewer {
  constructor(containerId, modelUrl) {
    this.container = document.getElementById(containerId);
    this.modelUrl = modelUrl;
    this.isARSupported = false;
    this.init();
  }

  async init() {
    // Check for AR support
    this.isARSupported = this.checkARSupport();
    
    if (this.container && this.modelUrl) {
      this.render();
    }
  }

  checkARSupport() {
    // Check for WebXR support
    if ('xr' in navigator) {
      return navigator.xr.isSessionSupported('immersive-ar').catch(() => false);
    }
    
    // Check for Quick Look (iOS)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Check for Scene Viewer (Android)
    const isAndroid = /Android/.test(navigator.userAgent);
    
    return isIOS || isAndroid;
  }

  render() {
    if (!this.container) return;

    // Use Google's Model-Viewer for cross-platform AR
    const modelViewer = document.createElement('model-viewer');
    modelViewer.setAttribute('src', this.modelUrl);
    modelViewer.setAttribute('alt', '3D Product Model');
    modelViewer.setAttribute('ar', '');
    modelViewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
    modelViewer.setAttribute('camera-controls', '');
    modelViewer.setAttribute('auto-rotate', '');
    modelViewer.setAttribute('exposure', '0.8');
    modelViewer.setAttribute('shadow-intensity', '1');
    modelViewer.setAttribute('shadow-softness', '0.5');
    modelViewer.style.width = '100%';
    modelViewer.style.height = '400px';

    // AR button
    const arButton = document.createElement('button');
    arButton.setAttribute('slot', 'ar-button');
    arButton.className = 'ar-button';
    arButton.innerHTML = '👁️ View in Your Space';
    arButton.style.cssText = `
      background: linear-gradient(135deg, #00ffff, #ff69b4);
      border: none;
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 10px;
      box-shadow: 0 4px 15px rgba(0, 255, 255, 0.3);
    `;

    modelViewer.appendChild(arButton);
    this.container.appendChild(modelViewer);

    // Add loading indicator
    modelViewer.addEventListener('load', () => {
      console.log('[AR Viewer] Model loaded');
    });

    modelViewer.addEventListener('error', (e) => {
      console.error('[AR Viewer] Error loading model:', e);
      this.showFallback();
    });
  }

  showFallback() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="ar-fallback" style="
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        border: 2px solid #00ffff;
      ">
        <h3 style="color: #00ffff; margin-bottom: 20px;">🥽 AR Experience</h3>
        <p style="color: #fff; margin-bottom: 20px;">
          View this product in augmented reality on your mobile device
        </p>
        <div style="
          background: #0c0c0c;
          padding: 30px;
          border-radius: 15px;
          margin: 20px 0;
        ">
          <p style="color: #ff69b4; font-size: 48px; margin: 0;">📱</p>
          <p style="color: #8892b0; margin-top: 10px;">Point your camera at a flat surface</p>
        </div>
        <button onclick="window.open('${this.modelUrl}', '_blank')" style="
          background: linear-gradient(135deg, #00ffff, #ff69b4);
          border: none;
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 16px;
          cursor: pointer;
        ">Download 3D Model</button>
      </div>
    `;
  }

  // Static method to create AR viewer for products
  static createForProduct(productId, imageUrl) {
    const container = document.getElementById(`ar-container-${productId}`);
    if (!container) return null;

    // For now, use image-based AR or placeholder
    // In production, this would use actual 3D models
    const modelUrl = imageUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
    
    return new ARViewer(`ar-container-${productId}`, modelUrl);
  }
}

// Load Model-Viewer from CDN if not already loaded
if (!customElements.get('model-viewer')) {
  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'https://unpkg.com/@google/model-viewer@3.4.0/dist/model-viewer.min.js';
  document.head.appendChild(script);
}

// Global instance
window.ARViewer = ARViewer;
