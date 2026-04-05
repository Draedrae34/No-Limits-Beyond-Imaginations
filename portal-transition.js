/**
 * 5D Portal Navigation - Black Hole Transition System
 * Creates immersive portal transitions between pages with visual and audio effects
 */

class PortalTransition {
    constructor() {
        this.overlay = null;
        this.canvas = null;
        this.ctx = null;
        this.audioContext = null;
        this.isActive = false;
        this.isMuted = false;
        this.particles = [];
        this.animationId = null;
        this.time = 0;
        this.portalRadius = 0;
        this.maxRadius = 0;
        
        this.init();
    }

    init() {
        this.createOverlay();
        this.setupAudioContext();
        this.setupNavigationInterception();
        this.createSoundToggle();
        
        // Handle emergence if we arrived via a portal
        if (new URLSearchParams(window.location.search).get('portal') === 'true') {
            this.handleEmergence();
        }
    }

    createOverlay() {
        // Create portal overlay element
        this.overlay = document.createElement('div');
        this.overlay.id = 'portal-overlay';
        this.overlay.innerHTML = `
            <canvas id="portal-canvas"></canvas>
            <div id="portal-warping"></div>
            <div id="portal-afterglow"></div>
            <div class="portal-loading">Entering the void...</div>
        `;
        document.body.appendChild(this.overlay);

        // Get canvas and context
        this.canvas = document.getElementById('portal-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.maxRadius = Math.max(this.canvas.width, this.canvas.height) * 0.8;
    }

    setupAudioContext() {
        // Initialize Web Audio API on user interaction
        const initAudio = () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
        };

        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
    }

    setupNavigationInterception() {
        // Intercept all internal navigation links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && !link.target && !link.hasAttribute('download') && this.isInternalLink(link.href)) {
                e.preventDefault();
                this.navigateTo(link.href);
            }
        });

        // Handle form submissions that might navigate
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.method === 'get' && form.action) {
                e.preventDefault();
                this.navigateTo(form.action + (form.action.includes('?') ? '&' : '?') + new FormData(form).toString());
            }
        });
    }

    isInternalLink(href) {
        if (!href) return false;
        try {
            const url = new URL(href, window.location.origin);
            // Ignore external origins
            if (url.origin !== window.location.origin) return false;
            // Ignore anchor links on the same page (to allow smooth scrolling)
            if (url.pathname === window.location.pathname && url.hash !== '') return false;
            // Ignore if it's exactly the same URL
            if (url.href === window.location.href.split('#')[0]) return false;
            return true;
        } catch (e) {
            return false;
        }
    }

    createSoundToggle() {
        // Check for existing sound toggle
        let toggle = document.querySelector('.portal-sound-toggle') || document.querySelector('.design-sound-toggle');
        
        if (!toggle) {
            toggle = document.createElement('button');
            toggle.className = 'portal-sound-toggle';
            toggle.innerHTML = '🔊';
            toggle.title = 'Toggle Portal Sound Effects';
            document.body.appendChild(toggle);
        }

        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleSound();
            toggle.classList.toggle('muted', this.isMuted);
            toggle.innerHTML = this.isMuted ? '🔇' : '🔊';
        });
    }

    toggleSound() {
        this.isMuted = !this.isMuted;
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    handleEmergence() {
        this.isActive = true;
        this.overlay.classList.add('active');
        
        // Start animation at high energy
        this.time = 2; 
        this.animateBlackHole();
        this.playPortalSound('emergence');
        
        const afterglow = document.getElementById('portal-afterglow');
        afterglow.classList.add('burst');

        setTimeout(() => {
            this.overlay.classList.remove('active');
            this.stopAnimation();
            this.isActive = false;
            
            // Clean up the URL to keep it pretty
            const url = new URL(window.location);
            url.searchParams.delete('portal');
            window.history.replaceState({}, '', url);
        }, 800);
    }

    async navigateTo(url) {
        if (this.isActive) return;
        this.isActive = true;

        // Add portal flag to the destination
        const target = new URL(url, window.location.origin);
        if (this.isInternalLink(target.href)) {
            target.searchParams.set('portal', 'true');
        }

        // Start the departure animation
        await this.startTransition();
        
        // Navigate to the new page
        window.location.href = target.toString();
    }

    async startTransition() {
        return new Promise((resolve) => {
            // Activate overlay
            this.overlay.classList.add('active');
            
            // Play entry sound
            this.playPortalSound('entry');

            // Start canvas animation
            this.time = 0;
            this.portalRadius = 0;
            this.animateBlackHole();

            // Apply warping effect to page content
            document.body.classList.add('portal-phase-sucking');

            // Create particle trails
            this.createParticles();

            // Phase 1: Sucking into black hole (2 seconds)
            setTimeout(() => {
                // Play transition sound
                this.playPortalSound('transition');
                
                // Add vibration effect
                this.overlay.classList.add('portal-vibrating');
            }, 500);

            // Phase 2: Burst through (2.5 seconds total)
            setTimeout(() => {
                this.overlay.classList.remove('portal-vibrating');
                document.body.classList.remove('portal-phase-sucking');
                
                // Trigger afterglow burst
                const afterglow = document.getElementById('portal-afterglow');
                afterglow.classList.add('burst');
                
                // Play emergence sound
                this.playPortalSound('emergence');
                
                // Fade out overlay
                setTimeout(() => {
                    this.overlay.classList.remove('active');
                    this.stopAnimation();
                    this.isActive = false;
                    resolve();
                }, 800);
            }, 2500);
        });
    }

    animateBlackHole() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, width, height);

        // Update time and radius
        this.time += 0.016;
        this.portalRadius = Math.min(this.maxRadius, this.time * 150);

        // Draw accretion disk
        this.drawAccretionDisk(centerX, centerY);

        // Draw event horizon
        this.drawEventHorizon(centerX, centerY);

        // Draw spiral arms
        this.drawSpiralArms(centerX, centerY);

        // Draw particles being sucked in
        this.drawParticles(centerX, centerY);

        // Draw gravitational lensing effect
        this.drawGravitationalLensing(centerX, centerY);

        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animateBlackHole());
    }

    drawAccretionDisk(centerX, centerY) {
        const ctx = this.ctx;
        const time = this.time;

        // Create gradient for accretion disk
        const gradient = ctx.createRadialGradient(
            centerX, centerY, this.portalRadius * 0.3,
            centerX, centerY, this.portalRadius * 1.5
        );

        // Add color stops with animation
        const hue = (time * 30) % 360;
        gradient.addColorStop(0, 'rgba(255, 100, 50, 0)');
        gradient.addColorStop(0.2, `hsla(${hue}, 100%, 60%, 0.8)`);
        gradient.addColorStop(0.4, `hsla(${hue + 30}, 100%, 50%, 0.6)`);
        gradient.addColorStop(0.6, `hsla(${hue + 60}, 100%, 40%, 0.4)`);
        gradient.addColorStop(0.8, `hsla(${hue + 90}, 100%, 30%, 0.2)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.portalRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawEventHorizon(centerX, centerY) {
        const ctx = this.ctx;
        const radius = this.portalRadius * 0.4;

        // Black hole core (event horizon)
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
        );

        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.9)');
        gradient.addColorStop(1, 'rgba(50, 50, 80, 0.3)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Glowing edge
        ctx.strokeStyle = `hsla(${(this.time * 50) % 360}, 100%, 70%, 0.5)`;
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    drawSpiralArms(centerX, centerY) {
        const ctx = this.ctx;
        const arms = 3;
        const armLength = this.portalRadius * 1.2;
        const time = this.time;

        for (let i = 0; i < arms; i++) {
            const angleOffset = (Math.PI * 2 / arms) * i;
            
            ctx.strokeStyle = `hsla(${(time * 40 + i * 120) % 360}, 100%, 60%, 0.4)`;
            ctx.lineWidth = 2;
            ctx.beginPath();

            for (let t = 0; t < 100; t++) {
                const progress = t / 100;
                const angle = angleOffset + time * 2 + progress * Math.PI * 2;
                const distance = progress * armLength * (1 + Math.sin(time * 3 + i) * 0.2);

                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;

                if (t === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();
        }
    }

    drawParticles(centerX, centerY) {
        const ctx = this.ctx;
        const time = this.time;

        // Generate new particles
        if (this.particles.length < 200 && Math.random() < 0.3) {
            this.particles.push(this.createParticle(centerX, centerY));
        }

        // Update and draw particles
        this.particles = this.particles.filter(p => p.life > 0);

        this.particles.forEach(p => {
            // Update particle position (spiraling toward center)
            const angle = p.angle + time * p.spiralSpeed;
            const distance = p.distance * (1 - p.suctionSpeed);
            
            p.x = centerX + Math.cos(angle) * distance;
            p.y = centerY + Math.sin(angle) * distance;
            p.angle = angle;
            p.distance = distance;
            p.life -= 0.01;
            p.size *= 0.99;

            // Draw particle
            ctx.fillStyle = `hsla(${p.hue}, 100%, ${p.lightness}%, ${p.life})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            // Add glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = `hsla(${p.hue}, 100%, 70%, ${p.life})`;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }

    createParticle(centerX, centerY) {
        const angle = Math.random() * Math.PI * 2;
        const distance = this.portalRadius * 1.5 + Math.random() * 200;
        
        return {
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            angle: angle,
            distance: distance,
            size: Math.random() * 4 + 1,
            hue: Math.random() * 60 + 20, // Orange-yellow range
            lightness: 50 + Math.random() * 30,
            spiralSpeed: 0.5 + Math.random() * 2,
            suctionSpeed: 0.005 + Math.random() * 0.015,
            life: 1
        };
    }

    drawGravitationalLensing(centerX, centerY) {
        const ctx = this.ctx;
        const radius = this.portalRadius * 0.6;

        // Create lensing effect
        const gradient = ctx.createRadialGradient(
            centerX, centerY, radius,
            centerX, centerY, radius * 2
        );

        gradient.addColorStop(0, 'rgba(100, 100, 200, 0)');
        gradient.addColorStop(0.5, 'rgba(150, 150, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(200, 200, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    createParticles() {
        // Add particle trails to body
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'portal-particle';
            particle.style.width = Math.random() * 10 + 5 + 'px';
            particle.style.height = particle.style.width;
            particle.style.background = `hsl(${Math.random() * 60 + 20}, 100%, 60%)`;
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.setProperty('--tx', (Math.random() - 0.5) * 500 + 'px');
            particle.style.setProperty('--ty', (Math.random() - 0.5) * 500 + 'px');
            document.body.appendChild(particle);

            // Remove after animation
            setTimeout(() => particle.remove(), 2000);
        }
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.particles = [];
        
        // Clear canvas
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Remove classes
        this.overlay.classList.remove('active');
        document.body.classList.remove('portal-phase-sucking', 'portal-phase-emerging');
        
        // Reset afterglow
        const afterglow = document.getElementById('portal-afterglow');
        afterglow.classList.remove('burst');
    }

    playPortalSound(phase) {
        if (this.isMuted || !this.audioContext) return;

        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        switch(phase) {
            case 'entry':
                // Low rumble building up
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(50, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 1.5);
                break;

            case 'transition':
                // Intense sucking sound
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1);
                gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 1);
                
                // Add white noise for texture
                this.playNoise(1);
                break;

            case 'emergence':
                // Burst of light sound
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(100, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.5);
                break;
        }
    }

    playNoise(duration) {
        if (!this.audioContext) return;
        
        const ctx = this.audioContext;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        
        noise.start(ctx.currentTime);
    }
}

// Initialize portal transition when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.portalTransition = new PortalTransition();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
        if (!window.portalTransition) {
            window.portalTransition = new PortalTransition();
        }
    }, 100);
}
