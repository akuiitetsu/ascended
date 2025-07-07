// Authentication handling
class Auth {
    constructor() {
        this.bindEvents();
        // Don't check auth state on page load since server handles this
    }

    bindEvents() {
        // Toggle forms
        document.getElementById('show-register')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('register-form').classList.remove('hidden');
        });

        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');
        });

        // Form submissions
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login(e.target);
        });

        document.getElementById('register-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.register(e.target);
        });

        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.logout();
        });
    }

    async login(form) {
        const data = {
            email: form.email.value,
            password: form.password.value,
            remember: form.remember.checked
        };

        console.log('Attempting login with:', { email: data.email, remember: data.remember }); // Debug logging

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            console.log('Response status:', response.status); // Debug logging
            
            const result = await response.json();
            console.log('Response data:', result); // Debug logging

            if (result.status === 'success') {
                this.currentUser = result.user;
                this.updateUI();
                this.showMessage('Login successful! Welcome back.', 'success');
                
                // Initialize game progress if game object exists
                if (window.game && typeof window.game.checkUserAuthentication === 'function') {
                    await window.game.checkUserAuthentication();
                    await window.game.loadSavedProgress();
                }
            } else {
                this.showMessage(result.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Login failed. Please try again.', 'error');
        }
    }

    async register(form) {
        if (form.password.value !== form.confirm_password.value) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        const data = {
            username: form.username.value,
            email: form.email.value,
            password: form.password.value
        };

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (result.status === 'success') {
                this.showMessage('Registration successful! Please log in.', 'success');
                this.showLoginForm();
            } else {
                this.showMessage(result.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage('Registration failed. Please try again.', 'error');
        }
    }

    showLoginForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm) loginForm.classList.remove('hidden');
        if (registerForm) registerForm.classList.add('hidden');
    }

    showRegisterForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm) loginForm.classList.add('hidden');
        if (registerForm) registerForm.classList.remove('hidden');
    }

    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white max-w-md ${
            type === 'success' ? 'bg-green-600' : 
            type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`;
        messageEl.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.remove();
            }
        }, 5000);
    }

    async logout() {
        try {
            // Save progress if game is active
            if (window.game && typeof window.game.saveProgress === 'function') {
                await window.game.saveProgress();
            }
            
            const response = await fetch('/api/auth/logout');
            if (response.ok) {
                this.currentUser = null;
                
                // Clear all local data
                localStorage.clear();
                sessionStorage.clear();
                
                // Redirect to home page
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout by clearing data and redirecting
            this.currentUser = null;
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
        }
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
});
