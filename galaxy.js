// Shared Galaxy Background System - 1000x Revolutionary, Advanced, Brilliant
class GalaxyBackground {
  constructor(containerId = 'galaxy-container') {
    this.containerId = containerId;
    this.stars = [];
    this.nebulas = [];
    this.dust = [];
    this.shootingStars = [];
    this.pulsars = [];
    this.supernovas = [];
    this.quantumLinks = [];
    this.timeDilationZones = [];
    this.interactiveElements = [];
    this.animationFrame = null;
    this.lastSupernovaTime = 0;
    this.quantumEntanglementActive = true;
    this.init();
  }

  init() {
    this.createGalaxy();
    this.startAdvancedAnimations();
    this.addInteractivity();
  }

  createGalaxy() {
    const galaxyContainer = document.getElementById(this.containerId);
    if (!galaxyContainer) return;

    // Enhanced star creation with multiple types
    const starCount = 2000; // Increased for brilliance
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      const starType = Math.random();
      if (starType < 0.1) {
        star.className = 'galaxy-stars giant';
        star.style.width = `${4 + Math.random() * 8}px`;
        star.style.height = star.style.width;
        star.style.boxShadow = `0 0 ${15 + Math.random() * 20}px #ffd700, 0 0 ${30 + Math.random() * 40}px #ff6b35`;
      } else if (starType < 0.3) {
        star.className = 'galaxy-stars binary';
        star.style.width = `${2 + Math.random() * 4}px`;
        star.style.height = star.style.width;
        star.style.boxShadow = `0 0 ${8 + Math.random() * 12}px #00ffff, 0 0 ${16 + Math.random() * 24}px #ff00ff`;
      } else {
        star.className = 'galaxy-stars';
        star.style.width = `${1 + Math.random() * 3}px`;
        star.style.height = star.style.width;
        star.style.boxShadow = `0 0 ${5 + Math.random() * 10}px #ffffff`;
      }
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 5}s`;
      star.dataset.x = Math.random() * 100;
      star.dataset.y = Math.random() * 100;
      galaxyContainer.appendChild(star);
      this.stars.push(star);
    }

    // Revolutionary nebulas with quantum properties
    const nebulaCount = 12; // Doubled
    for (let i = 0; i < nebulaCount; i++) {
      const nebula = document.createElement('div');
      nebula.className = 'galaxy-nebula';
      nebula.style.left = `${Math.random() * 80}%`;
      nebula.style.top = `${Math.random() * 80}%`;
      nebula.style.width = `${300 + Math.random() * 600}px`;
      nebula.style.height = `${300 + Math.random() * 600}px`;
      nebula.style.animationDelay = `${Math.random() * 15}s`;
      nebula.style.background = `radial-gradient(circle, rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3) 0%, rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.1) 50%, transparent 100%)`;
      galaxyContainer.appendChild(nebula);
      this.nebulas.push(nebula);
    }

    // Advanced cosmic dust with particle physics
    const dustCount = 800; // Increased
    for (let i = 0; i < dustCount; i++) {
      const dust = document.createElement('div');
      dust.className = 'galaxy-dust';
      dust.style.left = `${Math.random() * 100}%`;
      dust.style.top = `${Math.random() * 100}%`;
      dust.style.animationDelay = `${Math.random() * 20}s`;
      dust.style.transform = `rotate(${Math.random() * 360}deg)`;
      galaxyContainer.appendChild(dust);
      this.dust.push(dust);
    }

    // Big Bang effect with quantum fluctuations
    const bigBang = document.createElement('div');
    bigBang.className = 'galaxy-big-bang';
    bigBang.style.left = '50%';
    bigBang.style.top = '50%';
    galaxyContainer.appendChild(bigBang);

    // Interactive black holes with event horizons
    for (let i = 0; i < 5; i++) {
      // Increased
      const blackHole = document.createElement('div');
      blackHole.className = 'galaxy-black-hole';
      blackHole.style.left = `${10 + Math.random() * 80}%`;
      blackHole.style.top = `${10 + Math.random() * 80}%`;
      blackHole.style.animationDelay = `${Math.random() * 10}s`;
      blackHole.addEventListener('click', () => this.createSupernova(blackHole));
      galaxyContainer.appendChild(blackHole);
      this.interactiveElements.push(blackHole);
    }

    // Star clusters with gravitational binding
    for (let i = 0; i < 10; i++) {
      // Increased
      const cluster = document.createElement('div');
      cluster.className = 'galaxy-star-cluster';
      cluster.style.left = `${Math.random() * 90}%`;
      cluster.style.top = `${Math.random() * 90}%`;
      cluster.style.animationDelay = `${Math.random() * 15}s`;
      // Add gravitationally bound stars
      for (let j = 0; j < 30; j++) {
        // Increased
        const star = document.createElement('div');
        star.className = 'galaxy-cluster-star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        cluster.appendChild(star);
      }
      galaxyContainer.appendChild(cluster);
    }

    // Add pulsars - rapidly rotating neutron stars
    for (let i = 0; i < 8; i++) {
      const pulsar = document.createElement('div');
      pulsar.className = 'galaxy-pulsar';
      pulsar.style.left = `${Math.random() * 100}%`;
      pulsar.style.top = `${Math.random() * 100}%`;
      pulsar.style.animationDelay = `${Math.random() * 2}s`;
      galaxyContainer.appendChild(pulsar);
      this.pulsars.push(pulsar);
    }

    // Time dilation zones
    for (let i = 0; i < 3; i++) {
      const zone = document.createElement('div');
      zone.className = 'galaxy-time-dilation';
      zone.style.left = `${Math.random() * 80}%`;
      zone.style.top = `${Math.random() * 80}%`;
      zone.style.width = `${100 + Math.random() * 200}px`;
      zone.style.height = zone.style.width;
      galaxyContainer.appendChild(zone);
      this.timeDilationZones.push(zone);
    }
  }

  startAdvancedAnimations() {
    const animate = () => {
      this.updateShootingStars();
      this.updateQuantumEntanglement();
      this.updateTimeDilation();
      this.checkForSupernova();
      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  updateShootingStars() {
    // Create occasional shooting stars
    if (Math.random() < 0.005) {
      // 0.5% chance per frame
      this.createShootingStar();
    }

    // Update existing shooting stars
    this.shootingStars = this.shootingStars.filter((star) => {
      const rect = star.getBoundingClientRect();
      if (
        rect.right < 0 ||
        rect.left > window.innerWidth ||
        rect.bottom < 0 ||
        rect.top > window.innerHeight
      ) {
        star.remove();
        return false;
      }
      return true;
    });
  }

  createShootingStar() {
    const galaxyContainer = document.getElementById(this.containerId);
    const star = document.createElement('div');
    star.className = 'galaxy-shooting-star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 20}%`; // Start from top
    star.style.transform = `rotate(${Math.random() * 60 - 30}deg)`; // Random angle
    galaxyContainer.appendChild(star);
    this.shootingStars.push(star);

    // Remove after animation
    setTimeout(() => {
      if (star.parentNode) star.remove();
    }, 2000);
  }

  updateQuantumEntanglement() {
    if (!this.quantumEntanglementActive) return;

    // Create quantum links between nearby stars occasionally
    if (Math.random() < 0.001) {
      this.createQuantumLink();
    }

    // Update existing links
    this.quantumLinks = this.quantumLinks.filter((link) => {
      link.lifespan--;
      if (link.lifespan <= 0) {
        link.element.remove();
        return false;
      }
      link.element.style.opacity = link.lifespan / 100;
      return true;
    });
  }

  createQuantumLink() {
    if (this.stars.length < 2) return;

    const star1 = this.stars[Math.floor(Math.random() * this.stars.length)];
    const star2 = this.stars[Math.floor(Math.random() * this.stars.length)];
    if (star1 === star2) return;

    const galaxyContainer = document.getElementById(this.containerId);
    const link = document.createElement('div');
    link.className = 'galaxy-quantum-link';

    const rect1 = star1.getBoundingClientRect();
    const rect2 = star2.getBoundingClientRect();
    const containerRect = galaxyContainer.getBoundingClientRect();

    const x1 = rect1.left - containerRect.left + rect1.width / 2;
    const y1 = rect1.top - containerRect.top + rect1.height / 2;
    const x2 = rect2.left - containerRect.left + rect2.width / 2;
    const y2 = rect2.top - containerRect.top + rect2.height / 2;

    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;

    link.style.left = `${x1}px`;
    link.style.top = `${y1}px`;
    link.style.width = `${distance}px`;
    link.style.transform = `rotate(${angle}deg)`;
    link.style.transformOrigin = '0 50%';

    galaxyContainer.appendChild(link);
    this.quantumLinks.push({ element: link, lifespan: 100 });
  }

  updateTimeDilation() {
    // Subtle time dilation effects on nearby elements
    this.timeDilationZones.forEach((zone) => {
      const zoneRect = zone.getBoundingClientRect();
      this.stars.forEach((star) => {
        const starRect = star.getBoundingClientRect();
        const distance = Math.sqrt(
          (starRect.left - zoneRect.left) ** 2 + (starRect.top - zoneRect.top) ** 2
        );
        if (distance < 150) {
          star.style.animationDuration = `${2 + Math.sin(Date.now() * 0.001) * 0.5}s`;
        } else {
          star.style.animationDuration = '';
        }
      });
    });
  }

  checkForSupernova() {
    const now = Date.now();
    if (now - this.lastSupernovaTime > 30000 && Math.random() < 0.0001) {
      // Rare event
      this.createSupernova();
      this.lastSupernovaTime = now;
    }
  }

  createSupernova(target = null) {
    const galaxyContainer = document.getElementById(this.containerId);
    const supernova = document.createElement('div');
    supernova.className = 'galaxy-supernova';

    if (target) {
      const rect = target.getBoundingClientRect();
      const containerRect = galaxyContainer.getBoundingClientRect();
      supernova.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
      supernova.style.top = `${rect.top - containerRect.top + rect.height / 2}px`;
    } else {
      supernova.style.left = `${Math.random() * 100}%`;
      supernova.style.top = `${Math.random() * 100}%`;
    }

    galaxyContainer.appendChild(supernova);
    this.supernovas.push(supernova);

    // Create particle explosion
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'galaxy-supernova-particle';
      particle.style.left = supernova.style.left;
      particle.style.top = supernova.style.top;
      particle.style.transform = `rotate(${i * 7.2}deg)`;
      galaxyContainer.appendChild(particle);
      setTimeout(() => particle.remove(), 3000);
    }

    // Remove supernova after animation
    setTimeout(() => {
      if (supernova.parentNode) supernova.remove();
      this.supernovas = this.supernovas.filter((s) => s !== supernova);
    }, 3000);
  }

  addInteractivity() {
    // Click anywhere to create mini supernova
    const galaxyContainer = document.getElementById(this.containerId);
    galaxyContainer.addEventListener('click', (e) => {
      if (e.target === galaxyContainer) {
        const miniSupernova = document.createElement('div');
        miniSupernova.className = 'galaxy-mini-supernova';
        miniSupernova.style.left = `${e.offsetX}px`;
        miniSupernova.style.top = `${e.offsetY}px`;
        galaxyContainer.appendChild(miniSupernova);
        setTimeout(() => miniSupernova.remove(), 1000);
      }
    });

    // Keyboard shortcuts for advanced features
    document.addEventListener('keydown', (e) => {
      if (e.key === 'q') {
        this.quantumEntanglementActive = !this.quantumEntanglementActive;
      }
      if (e.key === 's') {
        this.createSupernova();
      }
    });
  }
}

// Initialize revolutionary galaxy background when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GalaxyBackground();
});
