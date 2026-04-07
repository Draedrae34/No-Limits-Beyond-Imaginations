// Portal Animation System
class PortalAnimation {
    constructor() {
        this.stars = [];
        this.portalActive = false;
        this.animationId = null;
        this.init();
    }

    init() {
        this.createGalaxy();
        this.setupEventListeners();
    }

    createGalaxy() {
        const galaxyContainer = document.querySelector('.galaxy-container');
        const starCount = 1500;

        // Create stars
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'stars';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 5}s`;
            star.style.width = `${Math.random() * 3}px`;
            star.style.height = `${Math.random() * 3}px`;
            star.style.boxShadow = `0 0 ${Math.random() * 10}px #fff`;
            galaxyContainer.appendChild(star);
            this.stars.push(star);
        }

        // Create nebulas
        for (let i = 0; i < 5; i++) {
            const nebula = document.createElement('div');
            nebula.className = 'nebula';
            nebula.style.left = `${Math.random() * 80}%`;
            nebula.style.top = `${Math.random() * 80}%`;
            nebula.style.width = `${200 + Math.random() * 300}px`;
            nebula.style.height = `${200 + Math.random() * 300}px`;
            nebula.style.animationDelay = `${Math.random() * 10}s`;
            galaxyContainer.appendChild(nebula);
        }

        // Create cosmic dust
        for (let i = 0; i < 200; i++) {
            const dust = document.createElement('div');
            dust.className = 'cosmic-dust';
            dust.style.left = `${Math.random() * 100}%`;
            dust.style.top = `${Math.random() * 100}%`;
            dust.style.animationDelay = `${Math.random() * 15}s`;
            galaxyContainer.appendChild(dust);
        }

        // Create big bang effect
        const bigBang = document.createElement('div');
        bigBang.className = 'big-bang';
        bigBang.style.left = '50%';
        bigBang.style.top = '50%';
        galaxyContainer.appendChild(bigBang);
    }

    setupEventListeners() {
        document.getElementById('activate').addEventListener('click', () => this.activatePortal());
        document.getElementById('deactivate').addEventListener('click', () => this.deactivatePortal());
    }

    activatePortal() {
        if (!this.portalActive) {
            this.portalActive = true;
            this.animatePortal(true);
            // Navigate to the workshop dashboard after animation
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000); // 2 second delay for animation
        }
    }

    deactivatePortal() {
        if (this.portalActive) {
            this.portalActive = false;
            this.animatePortal(false);
        }
    }

    animatePortal(activate) {
        const portal = document.querySelector('.portal');
        if (activate) {
            portal.style.transform = 'scale(1.2)';
            portal.style.boxShadow = '0 0 100px rgba(138, 43, 226, 0.8)';
            this.startFractalAnimation();
        } else {
            portal.style.transform = 'scale(1)';
            portal.style.boxShadow = '0 0 50px rgba(138, 43, 226, 0.5)';
            this.stopFractalAnimation();
        }
    }

    startFractalAnimation() {
        this.animationId = requestAnimationFrame(this.fractalAnimation.bind(this));
    }

    stopFractalAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    fractalAnimation() {
        // Advanced fractal animation logic would go here
        // For now, we'll just keep the animation running
        this.animationId = requestAnimationFrame(this.fractalAnimation.bind(this));
    }
}

// Initialize the portal animation when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PortalAnimation();
});