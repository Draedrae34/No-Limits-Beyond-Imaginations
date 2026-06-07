// Authentication functionality

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const logoutBtn = document.getElementById('logout-btn');

    async function performLogin(password = '') {
        try {
            const response = await fetch('/api/auth?action=login', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'login', password }),
            });

            const data = await response.json();
            if (data.success) {
                window.location.href = '/workshop.html';
                return;
            }

            errorMessage.textContent = data.message || 'Login failed. Please try again.';
        } catch (error) {
            console.error('Login failed:', error);
            errorMessage.textContent = 'Login failed. Please try again.';
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const password = passwordInput ? passwordInput.value.trim() : '';
            performLogin(password);
        });
    }


    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function () {
            try {
                await fetch('/api/auth?action=logout', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'logout' }),
                });
                window.location.href = '/workshop-login.html';
            } catch (error) {
                console.error('Logout failed:', error);
                window.location.href = '/workshop-login.html';
            }
        });
    }
});
