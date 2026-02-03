// Shared Galaxy Background System
class GalaxyBackground {
    constructor(containerId = 'galaxy-container') {
        this.containerId = containerId;
        this.stars = [];
        this.nebulas = [];
        this.dust = [];
        this.init();
    }

    init() {
        this.createGalaxy();
    }

    createGalaxy() {
        const galaxyContainer = document.getElementById(this.containerId);
        if (!galaxyContainer) return;

        // Create stars
        const starCount = 1200;
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'galaxy-stars';
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
        const nebulaCount = 6;
        for (let i = 0; i < nebulaCount; i++) {
            const nebula = document.createElement('div');
            nebula.className = 'galaxy-nebula';
            nebula.style.left = `${Math.random() * 80}%`;
            nebula.style.top = `${Math.random() * 80}%`;
            nebula.style.width = `${250 + Math.random() * 400}px`;
            nebula.style.height = `${250 + Math.random() * 400}px`;
            nebula.style.animationDelay = `${Math.random() * 15}s`;
            galaxyContainer.appendChild(nebula);
            this.nebulas.push(nebula);
        }

        // Create cosmic dust
        const dustCount = 300;
        for (let i = 0; i < dustCount; i++) {
            const dust = document.createElement('div');
            dust.className = 'galaxy-dust';
            dust.style.left = `${Math.random() * 100}%`;
            dust.style.top = `${Math.random() * 100}%`;
            dust.style.animationDelay = `${Math.random() * 20}s`;
            galaxyContainer.appendChild(dust);
            this.dust.push(dust);
        }

        // Create big bang effect
        const bigBang = document.createElement('div');
        bigBang.className = 'galaxy-big-bang';
        bigBang.style.left = '50%';
        bigBang.style.top = '50%';
        galaxyContainer.appendChild(bigBang);

        // Create black holes
        for (let i = 0; i < 3; i++) {
            const blackHole = document.createElement('div');
            blackHole.className = 'galaxy-black-hole';
            blackHole.style.left = `${20 + Math.random() * 60}%`;
            blackHole.style.top = `${20 + Math.random() * 60}%`;
            blackHole.style.animationDelay = `${Math.random() * 10}s`;
            galaxyContainer.appendChild(blackHole);
        }

        // Create star clusters
        for (let i = 0; i < 5; i++) {
            const cluster = document.createElement('div');
            cluster.className = 'galaxy-star-cluster';
            cluster.style.left = `${Math.random() * 90}%`;
            cluster.style.top = `${Math.random() * 90}%`;
            cluster.style.animationDelay = `${Math.random() * 15}s`;
            // Add stars to cluster
            for (let j = 0; j < 20; j++) {
                const star = document.createElement('div');
                star.className = 'galaxy-cluster-star';
                star.style.left = `${Math.random() * 100}%`;
                star.style.top = `${Math.random() * 100}%`;
                star.style.animationDelay = `${Math.random() * 3}s`;
                cluster.appendChild(star);
            }
            galaxyContainer.appendChild(cluster);
        }
    }
}

// Initialize galaxy background when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GalaxyBackground();
});