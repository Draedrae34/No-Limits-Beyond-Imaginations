/**
 * Phase 2: Lil Mystic Core Engine
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

  summarizeMemory(limit = 5) {
    return this.memory.keys
      .slice(-limit)
      .map((key) => {
        const item = this.memory.snapshots[key];
        return `${item.label}: ${item.content.slice(0, 120)}${item.content.length > 120 ? '...' : ''}`;
      })
      .join('\n');
  }

  copyToMemory(label, content) {
    const snapshot = this.rememberSnapshot(label, content);
    if (snapshot) {
      this.memory.lastCopied = label.toString().trim().toLowerCase();
    }
    return snapshot;
  }

  forgetSnapshot(label) {
    const key = label?.toString().trim().toLowerCase();
    if (!key) return false;
    delete this.memory.snapshots[key];
    this.memory.keys = this.memory.keys.filter((k) => k !== key);
    return true;
  }

  clearMemory() {
    this.memory.snapshots = {};
    this.memory.keys = [];
    this.memory.lastCopied = null;
  }

  selfUpgrade(level = 'adaptive core') {
    this.state.mood = 'analysis';
    this.setMood('neutral');
    this.reactiveLight.intensity = Math.min(14, this.reactiveLight.intensity + 2);
    this.memory.isUpgraded = true;
    this.memory.lastUpgrade = { level, timestamp: new Date().toISOString() };
    return this.memory.lastUpgrade;
  }

  // Voice hooks
  onSpeak(intensity) {
    this.state.intensity = intensity;

    const scale = 1 + intensity * 0.5;
    if (this.avatar) this.avatar.scale.set(scale, scale, scale);

    this.reactiveLight.intensity = 5 + intensity * 10;
    this.reactiveLight.color.setHex(this.state.colors.talking);
  }

  onListen() {
    this.state.intensity = 0;
    const baseColor =
      this.state.colors[this.state.mood] || this.state.colors.neutral;
    this.reactiveLight.color.setHex(baseColor);
    this.applyColorToAvatar(baseColor);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Particles
    if (this.particles) {
      const speed = 0.05 + this.state.intensity * 0.15;
      this.particles.rotation.y += delta * speed;
      this.particles.rotation.x += delta * (speed / 2);
      this.particles.material.size =
        0.05 +
        Math.sin(elapsed * 2) * 0.01 +
        this.state.intensity * 0.05;
    }

    // Rings
    this.rings.forEach((ringObj) => {
      ringObj.mesh.rotation.z += delta * ringObj.speed;
      ringObj.mesh.rotation.x += delta * (ringObj.speed / 2);
    });

    // Core breathing
    if (this.avatar) {
      const breathe = 1 + Math.sin(elapsed * 2) * 0.05;
      this.avatar.scale.set(
        breathe + this.state.intensity * 0.2,
        breathe + this.state.intensity * 0.2,
        breathe + this.state.intensity * 0.2
      );
      this.avatar.rotation.y += delta * 0.5;
    }

    // GLTF animations
    if (this.mixer) this.mixer.update(delta);

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.container) return;
    const width = Math.max(this.container.clientWidth, this.minWidth);
    const height = Math.max(this.container.clientHeight, this.minHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Load a GLTF avatar model
   */
  loadAvatarModel(modelPath) {
    const loader =
      typeof THREE.GLTFLoader !== "undefined"
        ? new THREE.GLTFLoader()
        : typeof GLTFLoader !== "undefined"
        ? new GLTFLoader()
        : null;

    if (!loader) {
      console.error(
        "LilMystic: GLTFLoader not found. Make sure it's loaded before lil-mystic.js."
      );
      return;
    }

    loader.load(modelPath, (gltf) => {
      if (this.avatar) this.scene.remove(this.avatar);
      this.avatar = gltf.scene;

      // Animation
      if (gltf.animations && gltf.animations.length) {
        this.mixer = new THREE.AnimationMixer(this.avatar);
        const action = this.mixer.clipAction(gltf.animations[0]);
        action.play();
      }

      // Hologram material
      this.avatar.traverse((node) => {
        if (node.isMesh) {
          node.material = new THREE.MeshStandardMaterial({
            color: this.state.colors.neutral,
            emissive: this.state.colors.neutral,
            emissiveIntensity: 0.6,
            wireframe: true,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
          });
        }
      });

      this.scene.add(this.avatar);
    });
  }

  /**
   * Signature gestures for Lil Mystic
   * type: 'greet' | 'affirm' | 'focus' | 'resonate'
   */
  performGesture(type = "greet") {
    if (!this.avatar) return;

    if (type === "greet") {
      // quick “what’s good” nod
      this.avatar.rotation.x = -0.15;
      setTimeout(() => {
        if (this.avatar) this.avatar.rotation.x = 0;
      }, 600);
    }

    if (type === "affirm") {
      // small “I got you” tilt
      this.avatar.rotation.z = 0.15;
      setTimeout(() => {
        if (this.avatar) this.avatar.rotation.z = 0;
      }, 500);
    }

    if (type === "focus") {
      // tighten in, like she’s locking in with you
      this.onSpeak(0.25);
      setTimeout(() => this.onListen(), 800);
    }

    if (type === "resonate") {
      // slow, deep resonance pulse
      const originalIntensity = this.state.intensity;
      this.onSpeak(0.6);
      setTimeout(() => {
        this.state.intensity = originalIntensity;
        this.onListen();
      }, 2000);
    }
  }

  /**
   * Deep Work mode (she locks in with you)
   */
  enterDeepWork() {
    // Calm, focused cyan
    this.setMood("neutral");
    this.state.intensity = 0.05;

    // Slow particles, tight orbit
    if (this.particles) {
      this.particles.rotation.x = 0;
      this.particles.rotation.y = 0;
    }
    this.rings.forEach((r) => (r.speed = 0.02));

    // Slight forward lean = “I’m locked in with you”
    if (this.avatar) {
      this.avatar.rotation.x = 0.15;
    }
  }

  exitDeepWork() {
    this.state.intensity = 0;
    this.onListen(); // reset to current mood
    if (this.avatar) {
      this.avatar.rotation.x = 0;
    }
  }

  /**
   * Guardian mode (she watches your pipeline)
   */
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
        // Alert tilt
        this.avatar.rotation.z = 0.2;
        setTimeout(() => {
          if (this.avatar) this.avatar.rotation.z = 0;
        }, 2000);
      }
    }
  }

  /**
   * Diagnostic Scan - Physical light sweep
   */
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

  /**
   * Glitch effect for system errors
   */
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

  /**
   * Visual recovery pulse when systems are restored
   */
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

  /**
   * Cleanup
   */
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
