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
                // Check if user is admin and redirect accordingly
                if (result.user && result.user.is_admin) {
                    window.location.href = '/admin';
                } else {
                    // Redirect regular users to their dashboard
                    window.location.href = '/dashboard';
                }
            } else {
                this.showMessage(result.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Login failed - network error', 'error');
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
                // Switch to login form after successful registration
                document.getElementById('show-login').click();
                this.showMessage('Registration successful! Please login.', 'success');
            } else {
                this.showMessage(result.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage('Registration failed', 'error');
        }
    }

    async logout() {
        try {
            await fetch('/api/auth/logout');
            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    showMessage(message, type = 'info') {
        // Create a simple notification system
        const messageDiv = document.createElement('div');
        messageDiv.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white ${
            type === 'error' ? 'bg-red-600' : 
            type === 'success' ? 'bg-green-600' : 
            'bg-blue-600'
        }`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    onLoginSuccess(user) {
        // Check if user is admin and redirect to admin dashboard
        if (user.is_admin) {
            window.location.href = '/admin';
            return;
        }
        
        // Redirect regular users to their dashboard
        window.location.href = '/dashboard';
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
});
        document.getElementById('logout-btn').classList.remove('hidden');
        
        this.showMessage(`Welcome back, ${user.username}!`, 'success');

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
});
