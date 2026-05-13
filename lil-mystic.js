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

        // Sacred Geometry Rings (The Spirit's Orbit)
        this.rings = [
            { id: 'ring-outer', speed: 0.02, rotation: { x: 0, y: 0, z: 0 } },
            { id: 'ring-inner', speed: -0.015, rotation: { x: 0, y: 0, z: 0 } },
            { id: 'ring-core', speed: 0.05, rotation: { x: 0, y: 0, z: 0 } }
        ];

        // Avatar State
        this.avatar = {
            rotation: { x: 0, y: 0, z: 0 },
            scale: 1,
            intensity: 0.8
        };

        if (this.container) {
            this.init();
        }
    }

    init() {
        console.log("Lil Mystic: Holographic Subsystems Online.");
        this.startRenderLoop();
    }

    startRenderLoop() {
        // Logic for the animation loop
        const update = () => {
            this.rings.forEach(ring => {
                ring.rotation.y += ring.speed;
            });
            requestAnimationFrame(update); 
        };
        update();
    }

    performGesture(gesture) {
        console.log(`[Lil Mystic] Executing Gesture: ${gesture}`);
        switch (gesture) {
            case "greet":
                // Transition to bow/welcome animation
                break;
            case "focus":
                // Increase hover height and glow
                break;
            case "affirm":
                // Subtle nod pulse
                break;
        }
    }

    onSpeak(level) {
        // Visual pulse mapped to audio/thinking frequency
        this.avatar.intensity = 0.8 + (level * 0.4);
        const pulseElement = this.container?.querySelector('.mystic-glow');
        if (pulseElement) {
            pulseElement.style.opacity = this.avatar.intensity;
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
        
        if (mood === "remembrance") {
            this.rings.forEach(r => r.speed *= 0.5); // Slow down for solemnity
        } else {
            this.rings[0].speed = 0.02;
            this.rings[1].speed = -0.015;
            this.rings[2].speed = 0.05;
        }
    }

    triggerRecoveryPulse() {
        console.log("[Lil Mystic] Harmonic Recovery Pulse Initiated.");
        this.performGesture("focus");
        // Visual burst logic
    }

    triggerScan() {
        console.log("[Lil Mystic] Diagnostic Grid Active.");
        // Grid overlay reveal
    }

    triggerGlitch() {
        console.log("[Lil Mystic] Critical Alert: Signal Jitter.");
        // Trigger RGB shift effect
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
        if (hudIntegrity) {
            hudIntegrity.style.width = status === "ok" ? "100%" : "20%";
            hudIntegrity.style.backgroundColor = status === "ok" ? "var(--mystic-primary)" : "#ff3b3b";
        }
    }
}

// Expose to window for workshop.js integration
window.LilMystic = LilMystic;
console.log("Lil Mystic Class successfully loaded into the Cosmic Workspace.");