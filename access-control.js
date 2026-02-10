const ACCESS_CONTROL_BACKEND_URL = window.NLBL_BACKEND_URL || "http://127.0.0.1:5001";
const buildAccessUrl = (path) => `${ACCESS_CONTROL_BACKEND_URL}${path}`;

// Access Control - Server-side authentication
const AccessControl = {
    STORAGE_KEY: 'nlbl_auth_token',

    hasPrivateAccess() {
        const token = localStorage.getItem(this.STORAGE_KEY);
        return !!token; // Check if token exists (verification happens server-side)
    },

    async checkAuth() {
        const token = localStorage.getItem(this.STORAGE_KEY);
        if (!token) return false;

        try {
            const response = await fetch(buildAccessUrl('/api/auth'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'verify',
                    token
                })
            });

            if (!response.ok) {
                return false;
            }

            const payload = await response.json();
            return payload.success;
        } catch (error) {
            console.error('Auth verify error:', error);
            return false;
        }
    },

    async authenticate(password) {
        try {
            const response = await fetch(buildAccessUrl('/api/auth'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    username: 'admin',
                    password: password
                })
            });

            const data = await response.json();

            if (data.success && data.token) {
                localStorage.setItem(this.STORAGE_KEY, data.token);
                return { success: true, message: 'Access granted' };
            }

            return { success: false, message: data.error || 'Invalid credentials' };
        } catch (error) {
            console.error('Authentication error:', error);
            return { success: false, message: 'Authentication failed' };
        }
    },

    logout() {
        localStorage.removeItem(this.STORAGE_KEY);
        window.location.href = 'index.html';
    },

    requirePrivateAccess() {
        if (!this.hasPrivateAccess()) {
            sessionStorage.setItem('redirect_after_login', window.location.href);
            this.showLoginModal();
            return false;
        }
        return true;
    },

    getNavItems() {
        // CUSTOMERS ONLY GET THESE - NOTHING ELSE
        const customerNavItems = [
            { href: 'index.html', label: '🏠 Home', private: false, icon: '🏠' },
            { href: 'shop.html', label: '👕 Products', private: false, icon: '👕' },
            { href: 'story-remembrance.html', label: '📖 My Story', private: false, icon: '📖' },
            { href: 'remembrance.html', label: '🕊️ Brothers', private: false, icon: '🕊️' },
            { href: 'about.html', label: 'ℹ️ About', private: false, icon: 'ℹ️' },
            { href: '#contact', label: '✉️ Contact', private: false, icon: '✉️' },
        ];

        // YOUR PRIVATE ACCESS - EVERYTHING
        const privateNavItems = [
            { href: 'private.html', label: '🔐 PRIVATE WORKSHOP', private: true, icon: '🔐' },
            { href: 'admin.html', label: '⚙️ ADMIN DASHBOARD', private: true, icon: '⚙️' },
            { href: 'orders.html', label: '📦 ORDER MANAGEMENT', private: true, icon: '📦' },
            { href: 'album.html', label: '🎵 MUSIC STUDIO', private: true, icon: '🎵' },
            { href: 'design.html', label: '🎨 UNLIMITED DESIGN LAB', private: true, icon: '🎨' },
            { href: 'security.html', label: '🛡️ SECURITY CENTER', private: true, icon: '🛡️' },
        ];

        if (this.hasPrivateAccess()) {
            return [...customerNavItems, ...privateNavItems];
        }
        return customerNavItems;
    },

    showLoginModal() {
        const modal = document.createElement('div');
        modal.id = 'access-login-modal';
        modal.className = 'access-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🔐 Private Access Required</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>This area is restricted to authorized personnel only.</p>
                    <div class="login-form">
                        <input type="password" id="private-access-password" placeholder="Enter access code">
                        <button id="submit-access" class="access-btn">Access Private Area</button>
                    </div>
                    <div id="access-message" class="access-message"></div>
                </div>
            </div>
        `;

        if (!document.getElementById('access-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'access-modal-styles';
            styles.textContent = `
                .access-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    backdrop-filter: blur(10px);
                }
                .modal-content {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 2px solid #00ffff;
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 450px;
                    width: 90%;
                    box-shadow: 0 0 40px rgba(0, 255, 255, 0.3);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .modal-header h2 {
                    color: #00ffff;
                    font-family: 'Orbitron', sans-serif;
                }
                .close-modal {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 30px;
                    cursor: pointer;
                }
                .modal-body p {
                    color: #ccc;
                    margin-bottom: 20px;
                }
                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                #private-access-password {
                    padding: 15px;
                    border: 2px solid #00ffff;
                    border-radius: 10px;
                    background: rgba(0, 0, 0, 0.5);
                    color: #fff;
                    font-size: 16px;
                    font-family: 'Orbitron', sans-serif;
                }
                .access-btn {
                    padding: 15px;
                    background: linear-gradient(45deg, #00ffff, #00ff88);
                    border: none;
                    border-radius: 10px;
                    color: #000;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    font-family: 'Orbitron', sans-serif;
                    transition: all 0.3s;
                }
                .access-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
                }
                .access-message {
                    margin-top: 15px;
                    text-align: center;
                    font-size: 14px;
                }
                .access-message.error {
                    color: #ff4444;
                }
                .access-message.success {
                    color: #00ff88;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => modal.remove());

        const submitBtn = modal.querySelector('#submit-access');
        const passwordInput = modal.querySelector('#private-access-password');
        const messageDiv = modal.querySelector('#access-message');

        submitBtn.addEventListener('click', async () => {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Accessing…';
            const result = await AccessControl.authenticate(passwordInput.value);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Access Private Area';

            if (result.success) {
                messageDiv.textContent = result.message;
                messageDiv.className = 'access-message success';
                setTimeout(() => {
                    modal.remove();
                    const redirectUrl = sessionStorage.getItem('redirect_after_login');
                    sessionStorage.removeItem('redirect_after_login');
                    if (redirectUrl) {
                        window.location.href = redirectUrl;
                    } else {
                        window.location.reload();
                    }
                }, 1000);
            } else {
                messageDiv.textContent = result.message;
                messageDiv.className = 'access-message error';
            }
        });

        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitBtn.click();
            }
        });

        return modal;
    },

    initNavigation() {
        const navList = document.querySelector('.quantum-nav ul');
        if (!navList) return;

        const items = this.getNavItems();
        navList.innerHTML = '';

        items.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = item.href;
            a.className = 'nav-link';
            a.setAttribute('data-glow', item.label.toLowerCase().replace(/\s+/g, '-'));
            a.textContent = item.label;

            if (item.private) {
                a.classList.add('private-nav-item');
            }

            li.appendChild(a);
            navList.appendChild(li);
        });

        if (this.hasPrivateAccess()) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'nav-link logout-btn';
            a.setAttribute('data-glow', 'logout');
            a.textContent = 'Logout 🔒';
            a.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
            li.appendChild(a);
            navList.appendChild(li);
        }
    },

    showCustomerViewBanner() {
        const banner = document.createElement('div');
        banner.id = 'customer-view-banner';
        banner.className = 'customer-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <span class="banner-icon">🛒</span>
                <span class="banner-text">Customer View - Limited Features</span>
                <button id="switch-to-private" class="switch-btn">Switch to Private View</button>
            </div>
        `;

        if (!document.getElementById('customer-banner-styles')) {
            const styles = document.createElement('style');
            styles.id = 'customer-banner-styles';
            styles.textContent = `
                .customer-banner {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.8);
                    border: 1px solid #333;
                    border-radius: 50px;
                    padding: 10px 20px;
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                }
                .banner-content {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .banner-icon {
                    font-size: 20px;
                }
                .banner-text {
                    color: #888;
                    font-size: 14px;
                }
                .switch-btn {
                    background: linear-gradient(45deg, #00ffff, #00ff88);
                    border: none;
                    border-radius: 20px;
                    padding: 8px 15px;
                    font-size: 12px;
                    cursor: pointer;
                    font-family: 'Orbitron', sans-serif;
                    color: #000;
                }
                .switch-btn:hover {
                    box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(banner);

        document.getElementById('switch-to-private').addEventListener('click', () => {
            this.showLoginModal();
        });
    },

    init() {
        this.initNavigation();

        document.querySelectorAll('.private-nav-item').forEach(link => {
            link.addEventListener('click', (e) => {
                if (!this.hasPrivateAccess()) {
                    e.preventDefault();
                    this.showLoginModal();
                }
            });
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AccessControl.init());
} else {
    AccessControl.init();
}
