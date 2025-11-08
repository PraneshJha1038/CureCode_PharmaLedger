
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.themeIcon = document.getElementById('theme-icon');
        this.init();
    }

    init() {
        // Load saved theme or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

       
        this.themeToggle?.addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        if (this.themeIcon) {
            this.themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
}

class LoginForm {
    constructor() {
        this.form = document.getElementById('login-form');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.passwordToggle = document.getElementById('password-toggle');
        this.loginBtn = document.getElementById('login-btn');
        this.errorMessage = document.getElementById('error-message');
        this.successMessage = document.getElementById('success-message');
        this.loadingOverlay = document.getElementById('loading-overlay');

        this.init();
    }

    init() {
        this.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        this.passwordToggle?.addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        // Input validation
        this.emailInput?.addEventListener('input', () => {
            this.validateInput(this.emailInput);
        });

        this.passwordInput?.addEventListener('input', () => {
            this.validateInput(this.passwordInput);
        });

        this.emailInput?.addEventListener('blur', () => {
            this.validateEmail();
        });

        this.passwordInput?.addEventListener('blur', () => {
            this.validatePassword();
        });
    }

    validateInput(input) {
        if (input.value.trim()) {
            input.classList.add('has-value');
        } else {
            input.classList.remove('has-value');
        }
    }
    // constraints for email passwords and phone numbers and similar fields
    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email && !emailRegex.test(email)) {
            this.showFieldError(this.emailInput, 'Please enter a valid email address');
            return false;
        } else {
            this.clearFieldError(this.emailInput);
            return true;
        }
    }

    validatePassword() {
        const password = this.passwordInput.value;

        if (password && password.length < 6) {
            this.showFieldError(this.passwordInput, 'Password must be at least 6 characters');
            return false;
        } else {
            this.clearFieldError(this.passwordInput);
            return true;
        }
    }

    showFieldError(input, message) {
        this.clearFieldError(input);

        const errorEl = document.createElement('div');
        errorEl.className = 'field-error';
        errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

        // Add styles
        errorEl.style.cssText = `
            color: var(--danger);
            font-size: 0.85rem;
            margin-top: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: slideDown 0.3s ease;
        `;

        // Insert after input wrapper
        input.parentNode.parentNode.appendChild(errorEl);

        // Add error styling to input
        input.style.borderColor = 'var(--danger)';
    }

    clearFieldError(input) {
        const errorEl = input.parentNode.parentNode.querySelector('.field-error');
        if (errorEl) {
            errorEl.remove();
        }
        input.style.borderColor = '';
    }

    togglePasswordVisibility() {
        const type = this.passwordInput.type === 'password' ? 'text' : 'password';
        this.passwordInput.type = type;

        const icon = this.passwordToggle.querySelector('i');
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    }

    async handleLogin() {
        // Hide previous messages
        this.hideMessages();

        // Validate inputs
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        const rememberMe = document.getElementById('remember-me').checked;

        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            const result = await this.authenticateUser(email, password, rememberMe);

            if (result.success) {
                this.showSuccess('Login successful! Redirecting...');

                if (rememberMe) {
                    localStorage.setItem('userSession', JSON.stringify({
                        email: email,
                        role: result.role,
                        token: result.token,
                        timestamp: Date.now()
                    }));
                }

                // Redirect based on role or id
                setTimeout(() => {
                    this.redirectUser(result.role);
                }, 2000);

            } else {
                this.showError(result.message || 'Invalid email or password');
            }

        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please check your connection and try again.');
        } finally {
            this.setLoadingState(false);
        }
    }
    // HARDCODED AS OF NOW, PLANNING TO MAKE IT BETTER AS WE MOVE FURTHER ( out of ideas as of now )
    async authenticateUser(email, password, rememberMe) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Demo credentials 
                const demoUsers = {
                    'admin@pharmaledger.com': { password: 'admin123', role: 'admin', name: 'System Admin' },
                    'manufacturer@demo.com': { password: 'manu123', role: 'manufacturer', name: 'Demo Pharmaceuticals' },
                    'pharmacy@demo.com': { password: 'pharm123', role: 'pharmacy', name: 'City Pharmacy' },
                    
                };

                const user = demoUsers[email.toLowerCase()];

                if (user && user.password === password) {
                    resolve({
                        success: true,
                        role: user.role,
                        name: user.name,
                        token: 'demo-jwt-token-' + Date.now(),
                        message: 'Login successful'
                    });
                } else {
                    resolve({
                        success: false,
                        message: 'Invalid email or password. Please try again.'
                    });
                }
            }, 2000); // Simulate network delay
        });
    }

    redirectUser(role) {
        // Redirect based on user role
        const redirectUrls = {
            'admin': 'dashboard-admin.html',
            'manufacturer': 'dashboard-manufacturer.html',
            'pharmacy': 'dashboard-pharmacy.html',
            
        };

        const url = redirectUrls[role] || 'index.html';
        window.location.href = url;
    }

    setLoadingState(isLoading) {
        const btnText = this.loginBtn.querySelector('.btn-text');
        const btnSpinner = this.loginBtn.querySelector('.btn-spinner');

        if (isLoading) {
            this.loginBtn.disabled = true;
            btnText.style.display = 'none';
            btnSpinner.style.display = 'inline-block';
            this.loadingOverlay.style.display = 'flex';
        } else {
            this.loginBtn.disabled = false;
            btnText.style.display = 'inline-block';
            btnSpinner.style.display = 'none';
            this.loadingOverlay.style.display = 'none';
        }
    }

    showError(message) {
        this.hideMessages();

        document.getElementById('error-text').textContent = message;
        this.errorMessage.style.display = 'flex';

        setTimeout(() => {
            this.hideMessages();
        }, 5000);

        // Scroll error into view
        this.errorMessage.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }

    showSuccess(message) {
        this.hideMessages();

        this.successMessage.querySelector('span').textContent = message;
        this.successMessage.style.display = 'flex';
    }

    hideMessages() {
        this.errorMessage.style.display = 'none';
        this.successMessage.style.display = 'none';
    }
}

class SessionManager {
    constructor() {
        this.init();
    }

    init() {
        this.checkExistingSession();
    }

    checkExistingSession() {
        const session = localStorage.getItem('userSession');

        if (session) {
            try {
                const sessionData = JSON.parse(session);
                const currentTime = Date.now();
                const sessionAge = currentTime - sessionData.timestamp;
                const maxAge = 24 * 60 * 60 * 1000; 

                if (sessionAge < maxAge) {
                    this.showContinueSession(sessionData);
                } else {
                    // Session expired
                    localStorage.removeItem('userSession');
                }
            } catch (error) {
                console.error('Session parsing error:', error);
                localStorage.removeItem('userSession');
            }
        }
    }
 
    showContinueSession(sessionData) {
        const notification = document.createElement('div');
        notification.className = 'session-notification';
        notification.innerHTML = `
            <div class="session-content">
                <i class="fas fa-info-circle"></i>
                <div class="session-text">
                    <h4>Welcome back, ${sessionData.email}</h4>
                    <p>Continue with your previous session?</p>
                </div>
                <div class="session-actions">
                    <button class="btn-continue" onclick="sessionManager.continueSession('${sessionData.role}')">
                        Continue
                    </button>
                    <button class="btn-new" onclick="sessionManager.newSession()">
                        New Login
                    </button>
                </div>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--bg-glass);
            backdrop-filter: var(--backdrop-blur);
            border: 1px solid var(--border-light);
            border-radius: 1rem;
            padding: 1.5rem;
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            max-width: 350px;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Auto remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    continueSession(role) {
        const notification = document.querySelector('.session-notification');
        if (notification) {
            notification.remove();
        }

        // Redirect to appropriate dashboard
        const redirectUrls = {
            'admin': 'dashboard-admin.html',
            'manufacturer': 'dashboard-manufacturer.html',
            'pharmacy': 'dashboard-pharmacy.html',
        };

        window.location.href = redirectUrls[role] || 'index.html';
    }

    newSession() {
        localStorage.removeItem('userSession');
        const notification = document.querySelector('.session-notification');
        if (notification) {
            notification.remove();
        }
    }
}

// Utility Functions
const utils = {
    // Email validation
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // Password strength checker
    checkPasswordStrength(password) {
        const strength = {
            score: 0,
            feedback: []
        };

        if (password.length >= 8) strength.score++;
        else strength.feedback.push('Use at least 8 characters');

        if (/[a-z]/.test(password)) strength.score++;
        else strength.feedback.push('Use lowercase letters');

        if (/[A-Z]/.test(password)) strength.score++;
        else strength.feedback.push('Use uppercase letters');

        if (/\d/.test(password)) strength.score++;
        else strength.feedback.push('Use numbers');

        if (/[^\w\s]/.test(password)) strength.score++;
        else strength.feedback.push('Use special characters');

        return strength;
    },

    // Format error messages
    formatErrorMessage(error) {
        const errorMessages = {
            'invalid_credentials': 'Invalid email or password',
            'account_locked': 'Account has been locked due to multiple failed attempts',
            'account_inactive': 'Account is inactive. Please contact administrator',
            'network_error': 'Network error. Please check your connection',
            'server_error': 'Server error. Please try again later'
        };

        return errorMessages[error] || 'An unexpected error occurred';
    }
};

// Performance Monitoring
const performance = {
    trackLoginAttempt(success, duration) {
        console.log(`Login attempt: ${success ? 'Success' : 'Failed'} in ${duration}ms`);
    },

    trackFormInteraction() {
        const startTime = Date.now();

        return {
            end: () => {
                const duration = Date.now() - startTime;
                console.log(`Form interaction duration: ${duration}ms`);
            }
        };
    }
};

// Initialize Application
class LoginApp {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
        } else {
            this.initializeComponents();
        }
    }

    initializeComponents() {
        try {
            // Initialize all components
            this.themeManager = new ThemeManager();
            this.loginForm = new LoginForm();
            this.sessionManager = new SessionManager();

            // Add keyboard shortcuts
            this.initKeyboardShortcuts();

            // Initialize error handling
            this.initErrorHandling();

            console.log('PharmaLedger Login app initialized successfully');
        } catch (error) {
            console.error('Error initializing login app:', error);
        }
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to submit form
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const form = document.getElementById('login-form');
                if (form) {
                    form.dispatchEvent(new Event('submit'));
                }
            }

            // Escape to clear form
            if (e.key === 'Escape') {
                const form = document.getElementById('login-form');
                if (form) {
                    form.reset();
                }
            }
        });
    }

    initErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });
    }
}

// Global variables for external access
let sessionManager;

// Start the application
document.addEventListener('DOMContentLoaded', () => {
    const app = new LoginApp();
    sessionManager = app.sessionManager;
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LoginApp, utils };
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .session-notification .session-content {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
    }

    .session-notification i {
        color: var(--primary);
        font-size: 1.5rem;
        margin-top: 0.25rem;
    }

    .session-notification .session-text h4 {
        margin: 0 0 0.25rem 0;
        color: var(--text-primary);
        font-size: 1rem;
    }

    .session-notification .session-text p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    .session-notification .session-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
    }

    .session-notification button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 500;
        transition: all 0.3s ease;
    }

    .session-notification .btn-continue {
        background: var(--primary);
        color: white;
    }

    .session-notification .btn-continue:hover {
        background: var(--primary-dark);
    }

    .session-notification .btn-new {
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        border: 1px solid var(--border-light);
    }

    .session-notification .btn-new:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }
`;
document.head.appendChild(style);

// demo ko iss ise replace further
// async authenticateUser(email, password, rememberMe) {
//     const response = await fetch('/api/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password, rememberMe })
//     });
//     return await response.json();
// }
