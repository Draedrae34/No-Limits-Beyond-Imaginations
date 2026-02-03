// Authentication functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');
    const errorMessage = document.getElementById('error-message');
    const logoutBtn = document.getElementById('logout-btn');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const password = passwordInput.value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ password }),
                });

                const data = await response.json();

                if (data.success) {
                    window.location.href = '/workshop/dashboard.html';
                } else {
                    errorMessage.textContent = data.message;
                }
            } catch (error) {
                errorMessage.textContent = 'Login failed. Please try again.';
            }
        });

        // Toggle password visibility
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.textContent = type === 'password' ? 'Show' : 'Hide';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/workshop/';
            } catch (error) {
                console.error('Logout failed:', error);
            }
        });
    }
});