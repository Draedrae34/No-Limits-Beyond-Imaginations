/* CINEMATIC PAGE TRANSITIONS - JAVASCRIPT */

class CinematicTransitions {
    constructor() {
        this.createTransitionElements();
        this.setupLinkInterception();
        this.setupScrollAnimations();
    }

    createTransitionElements() {
        // Create warp overlay
        this.warpOverlay = document.createElement('div');
        this.warpOverlay.className = 'warp-overlay';
        this.warpOverlay.innerHTML = '<div class="warp-stars"></div>';
        document.body.appendChild(this.warpOverlay);

        // Create fade overlay
        this.fadeOverlay = document.createElement('div');
        this.fadeOverlay.className = 'page-fade';
        document.body.appendChild(this.fadeOverlay);

        // Create galaxy swirl
        this.galaxySwirl = document.createElement('div');
        this.galaxySwirl.className = 'galaxy-swirl';
        document.body.appendChild(this.galaxySwirl);
    }

    setupLinkInterception() {
        // Intercept all internal links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) {
                return;
            }

            // Don't intercept if it's a download or external
            if (link.download || link.target === '_blank') {
                return;
            }

            e.preventDefault();
            this.transitionTo(href);
        });
    }

    transitionTo(url, type = 'warp') {
        const transition = this[type] || this.warp;
        transition.call(this, url);
    }

    warp(url) {
        this.warpOverlay.classList.add('active');
        this.createWarpStars();

        setTimeout(() => {
            window.location.href = url;
        }, 800);
    }

    fade(url) {
        this.fadeOverlay.classList.add('active');
        setTimeout(() => {
            window.location.href = url;
        }, 500);
    }

    swirl(url) {
        this.galaxySwirl.classList.add('active');
        setTimeout(() => {
            window.location.href = url;
        }, 800);
    }

    createWarpStars() {
        const starsContainer = this.warpOverlay.querySelector('.warp-stars');
        starsContainer.innerHTML = '';

        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'warp-star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 0.5 + 's';
            starsContainer.appendChild(star);
        }
    }

    setupScrollAnimations() {
        // Add scroll-triggered animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });

        // Observe elements with latent-section class
        document.querySelectorAll('.latent-section').forEach(section => {
            observer.observe(section);
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cinematicTransitions = new CinematicTransitions();
});

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';

// Add page load animation
window.addEventListener('load', () => {
    document.body.classList.add('page-loaded');
});
