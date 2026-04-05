/* COSMIC SOUND DESIGN - JAVASCRIPT */

class CosmicSoundSystem {
    constructor() {
        this.audioContext = null;
        this.ambientGain = null;
        this.isMuted = false;
        this.sounds = {};
        this.init();
    }

    init() {
        this.createSoundControls();
        this.setupAudioContext();
        this.loadSounds();
    }

    createSoundControls() {
        // Create sound controls container
        const controls = document.createElement('div');
        controls.className = 'sound-controls';
        
        // Mute button
        const muteBtn = document.createElement('button');
        muteBtn.className = 'sound-btn';
        muteBtn.id = 'mute-btn';
        muteBtn.innerHTML = '🔊';
        muteBtn.onclick = () => this.toggleMute();
        
        controls.appendChild(muteBtn);
        document.body.appendChild(controls);
        
        // Sound wave indicator
        const waveIndicator = document.createElement('div');
        waveIndicator.className = 'sound-wave';
        waveIndicator.id = 'sound-wave';
        
        for (let i = 0; i < 5; i++) {
            const bar = document.createElement('div');
            bar.className = 'sound-wave-bar';
            waveIndicator.appendChild(bar);
        }
        
        document.body.appendChild(waveIndicator);
        
        // Ambient sound indicator
        const ambientIndicator = document.createElement('div');
        ambientIndicator.className = 'ambient-indicator';
        ambientIndicator.id = 'ambient-indicator';
        ambientIndicator.innerHTML = '🌌 Cosmic ambiance active';
        document.body.appendChild(ambientIndicator);
        
        // Hide indicator after 5 seconds
        setTimeout(() => {
            ambientIndicator.classList.remove('visible');
        }, 5000);
    }

    setupAudioContext() {
        // Create audio context on first user interaction
        const initAudio = () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.createAmbientSound();
                this.showAmbientIndicator();
            }
        };
        
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('mousemove', initAudio, { once: true });
    }

    createAmbientSound() {
        if (!this.audioContext) return;
        
        // Create ambient cosmic drone
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const oscillator3 = this.audioContext.createOscillator();
        
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // Set up oscillators for cosmic drone
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(110, this.audioContext.currentTime); // A2
        
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(164.81, this.audioContext.currentTime); // E3
        
        oscillator3.type = 'sine';
        oscillator3.frequency.setValueAtTime(220, this.audioContext.currentTime); // A3
        
        // Filter for spacey sound
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        
        // Gain for volume control
        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        
        // Connect nodes
        oscillator1.connect(filter);
        oscillator2.connect(filter);
        oscillator3.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Start oscillators
        oscillator1.start();
        oscillator2.start();
        oscillator3.start();
        
        // Store references
        this.ambientOscillators = [oscillator1, oscillator2, oscillator3];
        this.ambientGain = gainNode;
        
        // Show sound wave indicator
        document.getElementById('sound-wave').classList.add('active');
    }

    loadSounds() {
        // Create sound effects using Web Audio API
        this.sounds = {
            click: () => this.createClickSound(),
            hover: () => this.createHoverSound(),
            warp: () => this.createWarpSound(),
            star: () => this.createStarSound()
        };
    }

    createClickSound() {
        if (!this.audioContext || this.isMuted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    createHoverSound() {
        if (!this.audioContext || this.isMuted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    createWarpSound() {
        if (!this.audioContext || this.isMuted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    createStarSound() {
        if (!this.audioContext || this.isMuted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        const muteBtn = document.getElementById('mute-btn');
        const waveIndicator = document.getElementById('sound-wave');
        
        if (this.isMuted) {
            muteBtn.innerHTML = '🔇';
            muteBtn.classList.add('muted');
            waveIndicator.classList.remove('active');
            
            if (this.ambientGain) {
                this.ambientGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            }
        } else {
            muteBtn.innerHTML = '🔊';
            muteBtn.classList.remove('muted');
            waveIndicator.classList.add('active');
            
            if (this.ambientGain) {
                this.ambientGain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
            }
        }
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }

    showAmbientIndicator() {
        const indicator = document.getElementById('ambient-indicator');
        if (indicator) {
            indicator.classList.add('visible');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cosmicSound = new CosmicSoundSystem();
    
    // Add sound effects to interactive elements
    document.querySelectorAll('button, a').forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (window.cosmicSound) {
                window.cosmicSound.play('hover');
            }
        });
        
        el.addEventListener('click', () => {
            if (window.cosmicSound) {
                window.cosmicSound.play('click');
            }
        });
    });
});
