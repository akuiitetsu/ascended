// Authentication handling
class Auth {
    constructor() {
        this.bindEvents();
        this.checkAuthState();
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
        // The 'email' field can now be email or username
        const data = {
            email: form.email.value, // can be email or username
            password: form.password.value
        };

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (result.status === 'success') {
                this.onLoginSuccess(result.user);
            } else {
                alert(result.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed');
        }
    }

    async register(form) {
        if (form.password.value !== form.confirm_password.value) {
            alert('Passwords do not match');
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
                alert('Registration successful! Please login.');
            } else {
                alert(result.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed');
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

    async checkAuthState() {
        try {
            const response = await fetch('/api/auth/user');
            const result = await response.json();

            if (result.status === 'success') {
                this.onLoginSuccess(result.user);
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    }

    onLoginSuccess(user) {
        // Hide auth forms
        document.getElementById('auth-forms').classList.add('hidden');
        // Show start game button
        document.getElementById('start-game').classList.remove('hidden');
        // Show user info
        document.getElementById('user-display').textContent = user.username;
        document.getElementById('logout-btn').classList.remove('hidden');
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
});
