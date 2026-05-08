/**
 * Lil Mystic 3D Hologram Interface
 * A living, breathing AI presence in your workshop.
 * Uses Three.js for 3D rendering, Web Audio for soundscape, and Speech Synthesis for voice.
 */

class LilMystic3D {
  constructor() {
    this.canvas = document.getElementById('lil-mystic-canvas');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mysticGroup = null;
    this.orb = null;
    this.rings = [];
    this.particles = null;
    this.mood = 'idle'; // idle, thinking, happy, error, speaking
    this.speechSynthesis = window.speechSynthesis;
    this.voice = null;
    this.ambientOscillator = null;
    this.audioContext = null;
    this.animationFrame = null;
    this.mouseX = 0;
    this.mouseY = 0;
    
    this.init();
  }

  async init() {
    this.setupScene();
    this.createHologram();
    this.setupLights();
    this.setupAudio();
    this.setupMouseTracking();
    this.animate();
    this.startAmbientSound();
    this.connectToAgent();
    this.setupFloatingPanels();
    
    console.log('🟣 Lil Mystic hologram initialized');
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0b1020, 0.002);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    window.addEventListener('resize', () => this.onResize());
  }

  createHologram() {
    this.mysticGroup = new THREE.Group();
    this.scene.add(this.mysticGroup);

    // Core orb (the "brain")
    const orbGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const orbMaterial = new THREE.MeshBasicMaterial({
      color: 0xff9cfb,
      transparent: true,
      opacity: 0.8,
      wireframe: false,
    });
    this.orb = new THREE.Mesh(orbGeometry, orbMaterial);
    this.mysticGroup.add(this.orb);

    // Outer glow shell
    const glowGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x7f5dff,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mysticGroup.add(glow);

    // Orbiting rings (satellites)
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(1.2 + i * 0.4, 0.02, 16, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0xff9cfb : i === 1 ? 0x7f5dff : 0x00d4ff,
        transparent: true,
        opacity: 0.6
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 + (i * 0.3);
      ring.rotation.y = i * 0.5;
      this.rings.push(ring);
      this.mysticGroup.add(ring);
    }

    // Particle cloud around the orb
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 4;
      positions[i + 1] = (Math.random() - 0.5) * 4;
      positions[i + 2] = (Math.random() - 0.5) * 4;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xa7b3ff,
      size: 0.02,
      transparent: true,
      opacity: 0.8
    });
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.mysticGroup.add(this.particles);
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xff9cfb, 1, 100);
    pointLight.position.set(2, 2, 2);
    this.scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x7f5dff, 1, 100);
    pointLight2.position.set(-2, -2, 2);
    this.scene.add(pointLight2);
  }

  setupAudio() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Ambient drone
    this.ambientOscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    this.ambientOscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    this.ambientOscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime);
    this.ambientOscillator.start();
  }

  setupMouseTracking() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  animate() {
    this.animationFrame = requestAnimationFrame(() => this.animate());

    const time = Date.now() * 0.001;

    // Orb pulse based on mood
    let pulseSpeed = 2; // idle
    let pulseAmp = 0.1;
    let baseColor = new THREE.Color(0xff9cfb);

    if (this.mood === 'thinking') {
      pulseSpeed = 4;
      pulseAmp = 0.2;
      baseColor = new THREE.Color(0xf1c40f);
    } else if (this.mood === 'happy') {
      pulseSpeed = 3;
      pulseAmp = 0.15;
      baseColor = new THREE.Color(0x2ecc71);
    } else if (this.mood === 'error') {
      pulseSpeed = 5;
      pulseAmp = 0.25;
      baseColor = new THREE.Color(0xe74c3c);
    } else if (this.mood === 'speaking') {
      pulseSpeed = 6;
      pulseAmp = 0.2;
      // Simulate voice modulation
      const audioScale = 1 + Math.sin(time * 10) * 0.1;
      this.orb.scale.setScalar(audioScale);
    }

    const scale = 1 + Math.sin(time * pulseSpeed) * pulseAmp;
    this.orb.scale.setScalar(scale);
    this.orb.material.color.lerp(baseColor, 0.1);

    // Rotate rings
    this.rings.forEach((ring, i) => {
      ring.rotation.x += 0.002 * (i + 1);
      ring.rotation.y += 0.003 * (i + 1);
    });

    // Rotate particles slowly
    this.particles.rotation.y = time * 0.05;

    // Look at mouse slightly
    this.mysticGroup.rotation.y += (this.mouseX * 0.3 - this.mysticGroup.rotation.y) * 0.05;
    this.mysticGroup.rotation.x += (this.mouseY * 0.2 - this.mysticGroup.rotation.x) * 0.05;

    this.renderer.render(this.scene, this.camera);
  }

  startAmbientSound() {
    // Subtle cosmic hum - already started in setupAudio
  }

  setMood(mood) {
    this.mood = mood;
    const statusEl = document.getElementById('mystic-status');
    if (statusEl) {
      const messages = {
        idle: 'Idle · Awaiting your command',
        thinking: 'Consulting the cosmos…',
        happy: 'Task complete ✓',
        error: 'Error in the matrix',
        speaking: 'Speaking…'
      };
      statusEl.textContent = messages[mood] || statusEl.textContent;
    }

    // Update orb color visually
    const colors = {
      idle: 0xff9cfb,
      thinking: 0xf1c40f,
      happy: 0x2ecc71,
      error: 0xe74c3c,
      speaking: 0x00d4ff
    };
    
    // Trigger visual feedback
    if (this.orb && colors[mood]) {
      this.orb.material.color.setHex(colors[mood]);
    }
  }

  speak(text) {
    if (!this.speechSynthesis) return;
    
    this.setMood('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    utterance.volume = 0.8;

    // Try to find a mystical/ethereal voice
    const voices = this.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google'));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      this.setMood('idle');
    };

    this.speechSynthesis.speak(utterance);
  }

  async connectToAgent() {
    // Test connection to backend agent
    try {
      const res = await fetch('/api/agent?action=heartbeat');
      if (res.ok) {
        console.log('✅ Connected to Lil Mystic core');
        this.speak('Lil Mystic online. Ready for your commands.');
      } else {
        this.speak('Connection to core unstable. Some features may be limited.');
      }
    } catch (e) {
      console.error('Agent connection failed:', e);
      this.speak('Core connection failed. Check your network.');
    }
  }

  setupFloatingPanels() {
    // Populate floating panels with live data
    this.fetchCatalogStats();
    this.fetchRecentOrders();
    this.setupAlertsStream();
    this.setupMetricsStream();
  }

  async fetchCatalogStats() {
    try {
      const res = await fetch('/api/shop?action=list');
      const data = await res.json();
      const list = document.getElementById('catalog-stats');
      if (list && data.products) {
        list.innerHTML = `
          <li>Total products: ${data.products.length}</li>
          <li>Featured: ${data.products.filter(p => p.featured).length}</li>
          <li>Cache mode: ${data.cacheMode || 'off'}</li>
        `;
      }
    } catch (e) {
      console.error('Catalog stats fetch failed:', e);
    }
  }

  async fetchRecentOrders() {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      const list = document.getElementById('orders-list');
      if (list && data.orders) {
        const recent = data.orders.slice(0, 5);
        list.innerHTML = recent.map(o => `
          <li>#${o.id} — ${o.status} — $${o.amount}</li>
        `).join('');
      }
    } catch (e) {
      console.error('Orders fetch failed:', e);
    }
  }

  setupAlertsStream() {
    // Simulate live alerts (in production, this would use WebSocket or SSE)
    const alerts = [
      'New product synced from Printify',
      'Routine completed successfully',
      'Cache mode toggled',
      'System health optimal'
    ];
    
    setInterval(() => {
      if (Math.random() > 0.7) {
        const alert = alerts[Math.floor(Math.random() * alerts.length)];
        const list = document.getElementById('alerts-list');
        if (list) {
          const li = document.createElement('li');
          li.textContent = `[${new Date().toLocaleTimeString()}] ${alert}`;
          li.style.opacity = '0.8';
          list.prepend(li);
          if (list.children.length > 5) list.removeChild(list.lastChild);
        }
      }
    }, 5000);
  }

  setupMetricsStream() {
    // Update metrics periodically
    setInterval(async () => {
      try {
        const res = await fetch('/api/agent?action=health');
        const data = await res.json();
        const list = document.getElementById('metrics-list');
        if (list && data.latency) {
          list.innerHTML = `
            <li>Latency: ${data.latency}ms</li>
            <li>Cache: ${data.cacheMode || 'off'}</li>
            <li>Uptime: ${(data.uptime || 0).toFixed(1)}s</li>
          `;
        }
      } catch (e) {
        // Silent fail
      }
    }, 3000);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Initialize Lil Mystic 3D when page loads
let lilMystic3D;
window.addEventListener('load', () => {
  setTimeout(() => {
    lilMystic3D = new LilMystic3D();
    window.lilMystic3D = lilMystic3D;
  }, 500);
});

// Export for use in other scripts
window.LilMystic3D = LilMystic3D;
