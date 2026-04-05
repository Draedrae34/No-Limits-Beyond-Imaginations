/* 3D MESSAGE WALL ENHANCEMENTS - JAVASCRIPT */

class MessageWall3D {
    constructor() {
        this.wall = document.getElementById('messagesWall');
        this.form = document.getElementById('messageForm');
        this.init();
    }

    init() {
        this.enhanceMessages();
        this.setupParticleBurst();
        this.addSearchFilter();
        this.addMessageCounter();
        this.setupFormEnhancements();
    }

    enhanceMessages() {
        if (!this.wall) return;

        // Add 3D rotation to messages on mouse move
        document.addEventListener('mousemove', (e) => {
            const messages = document.querySelectorAll('.wall-message');
            const mouseX = e.clientX / window.innerWidth - 0.5;
            const mouseY = e.clientY / window.innerHeight - 0.5;

            messages.forEach((msg, index) => {
                const rect = msg.getBoundingClientRect();
                const msgX = rect.left + rect.width / 2;
                const msgY = rect.top + rect.height / 2;
                
                const distX = (e.clientX - msgX) / window.innerWidth;
                const distY = (e.clientY - msgY) / window.innerHeight;
                
                if (Math.abs(distX) < 0.3 && Math.abs(distY) < 0.3) {
                    const rotateY = distX * 20;
                    const rotateX = -distY * 20;
                    msg.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
                } else {
                    msg.style.transform = '';
                }
            });
        });
    }

    setupParticleBurst() {
        if (!this.form) return;

        this.form.addEventListener('submit', (e) => {
            setTimeout(() => {
                this.createParticleBurst();
            }, 100);
        });
    }

    createParticleBurst() {
        const burst = document.createElement('div');
        burst.className = 'particle-burst';
        
        const rect = this.form.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        burst.style.left = centerX + 'px';
        burst.style.top = centerY + 'px';
        
        const colors = ['#8b5cf6', '#da22ff', '#00ffff', '#ffd700', '#ff69b4'];
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'burst-particle';
            
            const angle = (Math.PI * 2 * i) / 30;
            const distance = 100 + Math.random() * 100;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.boxShadow = `0 0 10px ${particle.style.background}`;
            
            burst.appendChild(particle);
        }
        
        document.body.appendChild(burst);
        
        setTimeout(() => burst.remove(), 1000);
    }

    addSearchFilter() {
        // Create search and filter container
        const container = document.createElement('div');
        container.className = 'search-filter-container';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'search-input';
        searchInput.placeholder = 'Search messages...';
        
        const filterSelect = document.createElement('select');
        filterSelect.className = 'filter-select';
        filterSelect.innerHTML = `
            <option value="all">All Messages</option>
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="name">By Name</option>
        `;
        
        container.appendChild(searchInput);
        container.appendChild(filterSelect);
        
        // Insert before the wall
        if (this.wall) {
            this.wall.parentNode.insertBefore(container, this.wall);
        }
        
        // Setup search functionality
        searchInput.addEventListener('input', (e) => {
            this.filterMessages(e.target.value, filterSelect.value);
        });
        
        filterSelect.addEventListener('change', (e) => {
            this.filterMessages(searchInput.value, e.target.value);
        });
    }

    filterMessages(searchTerm, filterType) {
        const messages = document.querySelectorAll('.wall-message');
        const term = searchTerm.toLowerCase();
        
        messages.forEach(msg => {
            const name = msg.querySelector('.name')?.textContent.toLowerCase() || '';
            const text = msg.querySelector('.text')?.textContent.toLowerCase() || '';
            
            const matchesSearch = !term || name.includes(term) || text.includes(term);
            
            if (matchesSearch) {
                msg.style.display = 'block';
                msg.style.animation = 'fadeIn 0.5s ease';
            } else {
                msg.style.display = 'none';
            }
        });
    }

    addMessageCounter() {
        const counter = document.createElement('div');
        counter.className = 'message-counter';
        
        const updateCounter = () => {
            const messages = document.querySelectorAll('.wall-message');
            counter.innerHTML = `<span>${messages.length}</span> Messages on the Wall`;
        };
        
        // Insert before the wall
        if (this.wall) {
            this.wall.parentNode.insertBefore(counter, this.wall);
            updateCounter();
        }
        
        // Update when messages change
        const observer = new MutationObserver(updateCounter);
        if (this.wall) {
            observer.observe(this.wall, { childList: true });
        }
    }

    setupFormEnhancements() {
        if (!this.form) return;
        
        // Add ripple effect to submit button
        const submitBtn = this.form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.classList.add('submit-btn');
            
            submitBtn.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                this.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
            });
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.messageWall3D = new MessageWall3D();
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    .submit-btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: rippleEffect 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes rippleEffect {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
