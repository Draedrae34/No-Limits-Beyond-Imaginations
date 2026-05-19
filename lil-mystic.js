/**
 * Lil Mystic Hologram Engine (Recovered Version)
 * The specialized 3D avatar controller for Silent Spirits Legacy.
 * Handles gestures, moods, and visual resonance.
 */
class LilMystic {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.mood = "neutral";
        this.isDeepWork = false;
        this.guardianStatus = "ok";
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.rings = [];
        this.core = null;
        this.particles = null;
        this.glowElement = null;
        this.clock = new THREE.Clock();
        this.targetZ = 5;
        this.time = 0;
        this.isScanning = false;
        this.isGlitching = false;
        this.isPulseActive = false;
        this.avatar = {
            rotation: { x: 0, y: 0, z: 0 },
            scale: 1,
            intensity: 0.8
        };

        if (this.container) {
            this.init();
            window.addEventListener('resize', () => this.onResize());
        }
    }

    init() {
        console.log("Lil Mystic: Holographic Subsystems Online.");
        
        // Setup Three.js Scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        this.glowElement = this.container.querySelector('.mystic-glow');

        // 1. Crystal Core (The Heart)
        const coreGeo = new THREE.IcosahedronGeometry(0.4, 1);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.8 });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.scene.add(this.core);

        // 2. Soul (Particle Field)
        const partCount = 200;
        const partGeo = new THREE.BufferGeometry();
        const pos = new Float32Array(partCount * 3);
        for(let i=0; i < partCount * 3; i++) pos[i] = (Math.random() - 0.5) * 6;
        partGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const partMat = new THREE.PointsMaterial({ color: 0x7000ff, size: 0.05, transparent: true, opacity: 0.5 });
        this.particles = new THREE.Points(partGeo, partMat);
        this.scene.add(this.particles);

        // Create Sacred Geometry Rings
        const ringConfigs = [
            { radius: 2, color: 0x00f2ff, speed: 0.01 },
            { radius: 1.5, color: 0x7000ff, speed: -0.015 },
            { radius: 1, color: 0x00ff88, speed: 0.02 }
        ];

        ringConfigs.forEach(conf => {
            const geo = new THREE.TorusGeometry(conf.radius, 0.02, 16, 100);
            const mat = new THREE.MeshBasicMaterial({ color: conf.color, transparent: true, opacity: 0.6 });
            const ring = new THREE.Mesh(geo, mat);
            ring.customSpeed = conf.speed;
            ring.baseSpeed = conf.speed;
            ring.baseOpacity = 0.6;
            this.scene.add(ring);
            this.rings.push(ring);
        });

        this.camera.position.z = 10; // Start further back for entry effect
        this.startRenderLoop();
    }

    onResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    startRenderLoop() {
        const update = () => {
            const delta = this.clock.getDelta();
            this.time += delta * (this.isPulseActive ? 5 : 1.5); 
            
            // Smooth camera transition
            const lerpFactor = 0.05;
            this.camera.position.z += (this.targetZ - this.camera.position.z) * lerpFactor;

            // Idle breathing effect
            const breathing = this.isGlitching ? (Math.random() * 0.2) : Math.sin(this.time * 0.5) * 0.05;
            const currentIntensity = this.avatar.intensity + breathing;

            // Animate Heart & Soul
            if (this.core) {
                this.core.rotation.x += delta * 0.5;
                this.core.rotation.y += delta * 0.8;
                const pulse = 1 + Math.sin(this.time * 2) * 0.1;
                this.core.scale.set(pulse, pulse, pulse);
            }
            if (this.particles) {
                this.particles.rotation.y += delta * 0.1;
                this.particles.material.opacity = (currentIntensity / 2);
            }

            this.rings.forEach(ring => {
                let speedMult = this.isScanning ? 10 : (this.isPulseActive ? 20 : 1);
                if (this.isGlitching) {
                    ring.rotation.x += (Math.random() - 0.5) * 0.5;
                    ring.position.x = (Math.random() - 0.5) * 0.1;
                } else {
                    ring.rotation.x += ring.customSpeed * delta * 60 * speedMult;
                    ring.rotation.y += ring.customSpeed * 1.5 * delta * 60 * speedMult;
                    ring.position.x = 0;
                }
                
                // Modulate material opacity based on avatar intensity
                if (ring.material) {
                    ring.material.opacity = ring.baseOpacity * (currentIntensity / 0.8);
                }
            });
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(update); 
        };
        update();
    }

    performGesture(gesture) {
        console.log(`[Lil Mystic] Executing Gesture: ${gesture}`);
        switch (gesture) {
            case "greet":
                this.rings.forEach(r => {
                    r.scale.set(1.2, 1.2, 1.2);
                    setTimeout(() => r.scale.set(1, 1, 1), 500);
                });
                break;
            case "focus":
                // Pull camera in and intensify glow
                this.targetZ = 4;
                this.avatar.intensity = 1.2;
                setTimeout(() => { this.avatar.intensity = 0.8; }, 1000);
                break;
            case "affirm":
                this.rings.forEach(r => {
                    const originalY = r.position.y;
                    r.position.y += 0.15;
                    setTimeout(() => r.position.y = originalY, 300);
                });
                break;
            case "memorize":
                // High-speed inward collapse for data ingestion
                this.targetZ = 3.5;
                this.rings.forEach(r => {
                    r.customSpeed *= 8;
                    r.scale.set(0.5, 0.5, 0.5);
                });
                setTimeout(() => this.setMood("neutral"), 2000);
                break;
            case "spiritGaze":
                // Position high up and tilt down
                this.targetZ = 6;
                this.camera.position.y = 4;
                this.camera.lookAt(0, 0, 0);
                this.avatar.intensity = 1.5;
                setTimeout(() => { this.camera.position.y = 0; }, 4000);
                break;
        }
    }

    onSpeak(level) {
        // Visual pulse mapped to audio/thinking frequency
        this.avatar.intensity = 0.8 + (level * 0.4);
        
        // Modulate rings slightly with speech for "breathing" effect
        this.rings.forEach((ring, i) => {
            const pulseScale = 1 + (level * 0.05 * (i + 1));
            ring.scale.set(pulseScale, pulseScale, pulseScale);
        });

        if (this.glowElement) {
            this.glowElement.style.opacity = this.avatar.intensity;
        }
    }

    onListen() {
        console.log("[Lil Mystic] Mode: Listening...");
        this.setMood("talking");
    }

    setMood(mood) {
        this.mood = mood;
        console.log(`[Lil Mystic] Resonance Shift: ${mood.toUpperCase()}`);
        
        // Update CSS Variables or Three.js Uniforms
        document.documentElement.style.setProperty('--mystic-current-mood', mood);
        
        // Reset to original sacred speeds before applying mood modifiers
        this.rings.forEach(ring => {
            ring.customSpeed = ring.baseSpeed;
        });

        if (mood === "neutral") {
            // Smoothly return camera to base position
            this.targetZ = 5;
        }

        if (mood === "remembrance") {
            this.rings.forEach(r => r.customSpeed *= 0.5); // Slow down for solemnity
        }

        if (mood === "analysis") {
            this.rings.forEach(r => r.customSpeed = 0.005); // Slow, stable rotation for data processing
        }
    }

    triggerRecoveryPulse() {
        this.isPulseActive = true;
        this.avatar.intensity = 2.0;
        this.rings.forEach(r => r.scale.set(2, 2, 2));
        
        setTimeout(() => {
            this.isPulseActive = false;
            this.avatar.intensity = 0.8;
            this.rings.forEach(r => r.scale.set(1, 1, 1));
            terminalLog("Harmonic Recovery Pulse Complete.", "mystic");
        }, 1500);
    }

    triggerScan() {
        this.isScanning = true;
        this.setMood("analysis");
        terminalLog("Lil Mystic is scanning local subspace...", "system");
        
        setTimeout(() => {
            this.isScanning = false;
            this.setMood("neutral");
            terminalLog("Scan complete: All spiritual anchors stable.", "mystic");
        }, 3000);
    }

    triggerGlitch() {
        this.isGlitching = true;
        setTimeout(() => {
            this.isGlitching = false;
        }, 500);
    }

    triggerNeuralIngestion() {
        console.log("[Lil Mystic] Photographic Buffer: ACTIVE.");
        this.isScanning = true;
        this.avatar.intensity = 2.5;
        
        // Rapid inward collapse to "ingest" data
        this.targetZ = 3;
        this.rings.forEach((r, i) => {
            r.scale.set(0.5, 0.5, 0.5);
            r.customSpeed *= (5 + i);
        });

        setTimeout(() => {
            this.isScanning = false;
            this.setMood("neutral");
            this.avatar.intensity = 0.8;
        }, 2000);
    }

    enterDeepWork() {
        this.isDeepWork = true;
        this.setMood("build");
        this.avatar.scale = 1.1;
        console.log("[Lil Mystic] Protocol: Deep Work - LOCKED IN.");
    }

    exitDeepWork() {
        this.isDeepWork = false;
        this.setMood("neutral");
        this.avatar.scale = 1.0;
        console.log("[Lil Mystic] Protocol: Deep Work - RELEASED.");
    }

    setGuardianStatus(status) {
        this.guardianStatus = status;
        const hudIntegrity = document.getElementById("hud-integrity-fill");
        
        // Physical color shift based on security status
        if (status !== "ok") {
            this.rings.forEach(r => r.material.color.setHex(0xff3b3b)); // Threat Red
            this.triggerGlitch();
        } else {
            // Restore sacred colors
            const colors = [0x00f2ff, 0x7000ff, 0x00ff88];
            this.rings.forEach((r, i) => r.material.color.setHex(colors[i]));
        }

        if (hudIntegrity) {
            hudIntegrity.style.width = status === "ok" ? "100%" : "20%";
            hudIntegrity.style.backgroundColor = status === "ok" ? "var(--mystic-primary)" : "#ff3b3b";
        }
    }
}

// Expose to window for workshop.js integration
window.LilMystic = LilMystic;
console.log("Lil Mystic Class successfully loaded into the Cosmic Workspace.");