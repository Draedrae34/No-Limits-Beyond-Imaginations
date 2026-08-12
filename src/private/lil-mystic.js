/* Lil Mystic private client bundle - moved to src/private for gated delivery */
/* Phase 2: Lil Mystic Core Engine
 * 3D Hologram, Particle Field, Orbiting Rings, Reactive Lighting, Mood + Voice Reactivity
 */

class LilMystic {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    this.particles = null;
    this.rings = [];
    this.avatar = null;
    this.clock = new THREE.Clock();
    this.mixer = null;

    this.state = {
      intensity: 0,
      mood: "neutral",
      colors: {
        neutral: 0x00f2ff,
        remembrance: 0x7000ff,
        talking: 0xff00d4,
      },
    };

    this.memory = {
      snapshots: {},
      keys: [],
      lastCopied: null,
      isUpgraded: false,
    };

    // fallback size if the container has not measured yet
    this.minWidth = 640;
    this.minHeight = 480;

    // bind resize so we can remove it later
    this._onResize = this.onWindowResize.bind(this);

    this.init();
  }

  init() {
    // Renderer
    const width = Math.max(this.container.clientWidth, this.minWidth);
    const height = Math.max(this.container.clientHeight, this.minHeight);
    this.renderer.setSize(width, height);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 2.0;
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(ambientLight);

    this.reactiveLight = new THREE.PointLight(
      this.state.colors.neutral,
      5,
      50
    );
    this.reactiveLight.position.set(0, 2, 2);
    this.scene.add(this.reactiveLight);

    // Core elements
    this.createParticleField();
    this.createOrbitingRings();
    this.createHologramCore();

    this.camera.position.z = 5;

    this.animate();
    window.addEventListener("resize", this._onResize);
  }

  createParticleField() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 5000; i++) {
      vertices.push(
        THREE.MathUtils.randFloatSpread(20),
        THREE.MathUtils.randFloatSpread(20),
        THREE.MathUtils.randFloatSpread(20)
      );
    }
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    const material = new THREE.PointsMaterial({
      color: 0x8888ff,
      size: 0.05,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  createOrbitingRings() {
    const ringConfigs = [
      { radius: 2, color: 0x00f2ff, speed: 0.5 },
      { radius: 2.5, color: 0x7000ff, speed: -0.3 },
      { radius: 3, color: 0xff00d4, speed: 0.2 },
    ];

    ringConfigs.forEach((config) => {
      const geometry = new THREE.TorusGeometry(config.radius, 0.02, 16, 100);
      const material = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(geometry, material);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;

      this.scene.add(ring);
      this.rings.push({ mesh: ring, speed: config.speed });
    });
  }

  createHologramCore() {
    const geometry = new THREE.IcosahedronGeometry(1, 15);
    const material = new THREE.MeshStandardMaterial({
      color: this.state.colors.neutral,
      emissive: this.state.colors.neutral,
      emissiveIntensity: 1.0,
      metalness: 0.25,
      roughness: 0.15,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.avatar = new THREE.Mesh(geometry, material);
    this.scene.add(this.avatar);
  }

  /**
   * Mood control: 'neutral', 'remembrance', etc.
   */
  setMood(mood) {
    if (!this.state.colors[mood]) return;
    this.state.mood = mood;
    const targetColor = this.state.colors[mood];
    this.applyColorToAvatar(targetColor);
    this.reactiveLight.color.setHex(targetColor);
  }

  applyColorToAvatar(hex) {
    if (!this.avatar) return;

    // If avatar is a Mesh
    if (this.avatar.isMesh && this.avatar.material) {
      this.avatar.material.color.setHex(hex);
      if (this.avatar.material.emissive) {
        this.avatar.material.emissive.setHex(hex);
      }
      return;
    }

    // If avatar is a Group (GLTF)
    this.avatar.traverse((node) => {
      if (node.isMesh && node.material) {
        node.material.color.setHex(hex);
        if (node.material.emissive) node.material.emissive.setHex(hex);
      }
    });
  }

  // Photographic memory and copycat capabilities
  rememberSnapshot(label, content) {
    if (!label || !content) return null;
    const key = label.toString().trim().toLowerCase();
    if (!key) return null;

    this.memory.snapshots[key] = {
      label: label.toString().trim(),
      content: content.toString(),
      timestamp: new Date().toISOString(),
    };

    if (!this.memory.keys.includes(key)) {
      this.memory.keys.push(key);
    }

    return this.memory.snapshots[key];
  }

  recallSnapshot(label) {
    if (!label) return null;
    const key = label.toString().trim().toLowerCase();
    return this.memory.snapshots[key] || null;
  }

  listMemoryKeys(limit = 25) {
    return this.memory.keys.slice(-limit).map((key) => this.memory.snapshots[key].label);
  }

  getMemoryEntries(options = {}) {
    const {
      query = '',
      sort = 'newest',
      limit = 50,
    } = options;
    const normalizedQuery = query.toString().trim().toLowerCase();

    let entries = this.memory.keys
      .map((key) => ({ key, ...this.memory.snapshots[key] }))
      .filter((item) => item && item.label && item.content);

    if (normalizedQuery) {
      entries = entries.filter((item) => {
        const haystack = `${item.label} ${item.content} ${item.timestamp}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }

    entries.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return sort === 'oldest' ? aTime - bTime : bTime - aTime;
    });

    return entries.slice(0, limit);
  }

  searchMemory(query, limit = 25) {
    return this.getMemoryEntries({ query, limit });
  }

  performGesture(type = "greet") {
    if (!this.avatar) return;

    if (type === "greet") {
      this.avatar.rotation.x = -0.15;
      setTimeout(() => {
        if (this.avatar) this.avatar.rotation.x = 0;
      }, 600);
    }

    if (type === "affirm") {
      this.avatar.rotation.z = 0.15;
      setTimeout(() => {
        if (this.avatar) this.avatar.rotation.z = 0;
      }, 500);
    }

    if (type === "focus") {
      this.onSpeak(0.25);
      setTimeout(() => this.onListen(), 800);
    }

    if (type === "resonate") {
      const originalIntensity = this.state.intensity;
      this.onSpeak(0.6);
      setTimeout(() => {
        this.state.intensity = originalIntensity;
        this.onListen();
      }, 2000);
    }
  }

  enterDeepWork() {
    this.setMood("neutral");
    this.state.intensity = 0.05;

    if (this.particles) {
      this.particles.rotation.x = 0;
      this.particles.rotation.y = 0;
    }
    this.rings.forEach((r) => (r.speed = 0.02));

    if (this.avatar) {
      this.avatar.rotation.x = 0.15;
    }
  }

  exitDeepWork() {
    this.state.intensity = 0;
    this.onListen();
    if (this.avatar) {
      this.avatar.rotation.x = 0;
    }
  }

  setGuardianStatus(status = "ok") {
    if (status === "ok") {
      this.setMood("neutral");
      this.state.intensity = 0.02;
    } else if (status === "warning") {
      this.setMood("talking");
      this.state.intensity = 0.2;
    } else if (status === "error") {
      this.setMood("talking");
      this.state.intensity = 0.4;
      if (this.avatar) {
        this.avatar.rotation.z = 0.2;
        setTimeout(() => {
          if (this.avatar) this.avatar.rotation.z = 0;
        }, 2000);
      }
    }
  }

  triggerScan() {
    if (!this.reactiveLight) return;
    const originalPos = this.reactiveLight.position.clone();
    const originalIntensity = this.reactiveLight.intensity;

    this.reactiveLight.intensity = 15;
    this.reactiveLight.position.y = -5;

    setTimeout(() => {
      this.reactiveLight.position.copy(originalPos);
      this.reactiveLight.intensity = originalIntensity;
    }, 1000);
  }

  triggerGlitch() {
    if (!this.avatar) return;
    const originalPos = this.avatar.position.clone();
    const glitchInterval = setInterval(() => {
      this.avatar.position.x = originalPos.x + (Math.random() - 0.5) * 0.3;
      this.avatar.position.y = originalPos.y + (Math.random() - 0.5) * 0.3;
    }, 40);
    setTimeout(() => {
      clearInterval(glitchInterval);
      this.avatar.position.copy(originalPos);
    }, 800);
  }

  triggerRecoveryPulse() {
    if (!this.avatar) return;
    const originalScale = this.avatar.scale.clone();

    let t = 0;
    const pulse = setInterval(() => {
      t += 0.1;
      const s = 1 + Math.sin(t * 10) * 0.1;
      this.avatar.scale.set(s, s, s);
    }, 40);

    setTimeout(() => {
      clearInterval(pulse);
      if (this.avatar) this.avatar.scale.copy(originalScale);
    }, 600);
  }

  dispose() {
    if (this.mixer) this.mixer.stopAllAction();
    this.renderer.dispose();
    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
    window.removeEventListener("resize", this._onResize);
  }
}

// expose to global scope when evaluated
window.LilMystic = LilMystic;
