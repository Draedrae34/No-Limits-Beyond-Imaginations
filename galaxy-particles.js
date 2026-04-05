/* 3D GALAXY PARTICLE SYSTEM - JAVASCRIPT */

class GalaxyParticleSystem {
    constructor() {
        this.canvas = document.getElementById('galaxy-canvas');
        if (!this.canvas) {
            this.createCanvas();
        }
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.stars = [];
        this.nebulae = [];
        this.mouse = { x: 0, y: 0 };
        this.init();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'galaxy-canvas';
        const container = document.createElement('div');
        container.className = 'galaxy-container';
        container.appendChild(this.canvas);
        document.body.insertBefore(container, document.body.firstChild);
        this.ctx = this.canvas.getContext('2d');
    }

    init() {
        this.resize();
        this.createParticles();
        this.createNebulae();
        this.createShootingStars();
        this.setupEventListeners();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    createParticles() {
        const particleCount = window.innerWidth < 768 ? 100 : 200;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                z: Math.random() * 1000,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.5 + 0.1,
                brightness: Math.random(),
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                color: this.getRandomStarColor()
            });
        }
    }

    getRandomStarColor() {
        const colors = [
            '255, 255, 255',   // White
            '139, 92, 246',    // Purple
            '218, 34, 255',    // Pink
            '0, 255, 255',     // Cyan
            '255, 215, 0',     // Gold
            '255, 105, 180'    // Hot Pink
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createNebulae() {
        const nebulaContainer = document.querySelector('.galaxy-container') || document.body;
        
        for (let i = 1; i <= 3; i++) {
            const nebula = document.createElement('div');
            nebula.className = `nebula-cloud ${this.getNebulaClass(i)}`;
            nebulaContainer.appendChild(nebula);
        }
    }

    getNebulaClass(num) {
        const classes = ['one', 'two', 'three'];
        return classes[num - 1] || 'one';
    }

    createShootingStars() {
        setInterval(() => {
            if (Math.random() > 0.7) {
                this.shootStar();
            }
        }, 2000);
    }

    shootStar() {
        const star = document.createElement('div');
        star.className = 'shooting-star';
        star.style.left = Math.random() * 50 + '%';
        star.style.top = Math.random() * 50 + '%';
        star.style.animationDuration = (Math.random() * 2 + 2) + 's';
        
        const container = document.querySelector('.galaxy-container') || document.body;
        container.appendChild(star);
        
        setTimeout(() => star.remove(), 4000);
    }

    setupEventListeners() {
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        // Add cursor glow
        const glow = document.createElement('div');
        glow.className = 'cursor-glow';
        document.body.appendChild(glow);

        document.addEventListener('mousemove', (e) => {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        this.particles.forEach(particle => {
            // Move particles
            particle.z -= particle.speed;
            if (particle.z <= 0) {
                particle.z = 1000;
                particle.x = Math.random() * this.canvas.width;
                particle.y = Math.random() * this.canvas.height;
            }

            // Calculate scale based on depth
            const scale = 1000 / (1000 - particle.z);
            const x = (particle.x - this.canvas.width / 2) * scale + this.canvas.width / 2;
            const y = (particle.y - this.canvas.height / 2) * scale + this.canvas.height / 2;
            const size = particle.size * scale;

            // Twinkle effect
            particle.brightness += particle.twinkleSpeed;
            if (particle.brightness > 1 || particle.brightness < 0.3) {
                particle.twinkleSpeed = -particle.twinkleSpeed;
            }

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${particle.color}, ${particle.brightness})`;
            this.ctx.fill();

            // Add glow
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = `rgba(${particle.color}, 0.5)`;
        });

        // Draw constellation lines between nearby stars
        this.drawConstellations();

        requestAnimationFrame(() => this.animate());
    }

    drawConstellations() {
        const maxDistance = 100;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    const opacity = (1 - distance / maxDistance) * 0.3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.galaxyParticles = new GalaxyParticleSystem();
});

// Add parallax effect to elements
document.addEventListener('mousemove', (e) => {
    const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
    const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
    
    document.querySelectorAll('.parallax-element').forEach(el => {
        el.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
});
