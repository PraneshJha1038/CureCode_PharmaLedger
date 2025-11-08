// Theme Manager
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

        // Add event listener for theme toggle
        this.themeToggle?.addEventListener('click', () => this.toggleTheme());
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

// Navbar Scroll Effect
class NavbarManager {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        this.navMenu = document.getElementById('nav-menu');
        this.init();
    }

    init() {
        // Scroll effect
        window.addEventListener('scroll', () => this.handleScroll());

        // Mobile menu toggle
        this.mobileMenuToggle?.addEventListener('click', () => this.toggleMobileMenu());

        // Smooth scrolling for nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    const navHeight = this.navbar ? this.navbar.offsetHeight : 80;
                    const offsetTop = targetElement.offsetTop - navHeight - 8;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
                if (this.navMenu?.classList.contains('active')) {
                    this.toggleMobileMenu();
                }
            });
        });
    }

    handleScroll() {
        if (this.navbar) {
            if (window.scrollY > 100) {
                this.navbar.classList.add('scrolled');
            } else {
                this.navbar.classList.remove('scrolled');
            }
        }
    }

    toggleMobileMenu() {
        this.navMenu?.classList.toggle('active');
        this.mobileMenuToggle?.classList.toggle('active');
    }
}

// Verification System (FULLY UPDATED - BACKEND INTEGRATION + INVALID FIX)
class VerificationManager {
    constructor() {
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.manualForm = document.getElementById('manual-verification');
        this.scannerButton = document.getElementById('start-scanner');
        this.qrVideo = document.getElementById('qr-video');
        this.verificationResult = document.getElementById('verification-result');
        this.init();
    }

    init() {
        // Tab switching
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });

        // Manual verification form
        this.manualForm?.addEventListener('submit', e => {
            e.preventDefault();
            this.handleManualVerification();
        });

        // QR Scanner
        this.scannerButton?.addEventListener('click', () => this.startQRScanner());
    }

    switchTab(tabId) {
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        this.tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabId}-tab`).classList.add('active');
    }

    async handleManualVerification() {
        const batchNumber = document.getElementById('batch-number').value.trim();
        if (!batchNumber) {
            this.showResultMessage('Please enter a batch number', false);
            return;
        }

        const submitButton = this.manualForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        submitButton.disabled = true;

        try {
            const apiUrl = `http://127.0.0.1:5000/api/verify-batch?batch_number=${encodeURIComponent(batchNumber.toUpperCase())}`;
            const response = await fetch(apiUrl);
            
            // if (!response.ok) {
            //     throw new Error(`Connection issue: ${response.status}`);
            // }

            const data = await response.json();
            this.showVerificationResult(data, batchNumber);
        // } catch (error) {
        //     console.error('Network Error:', error);
        //     this.showResultMessage(`Connection error: ${error.message}. Check if backend is running.`, false);
        } finally {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    showVerificationResult(data, enteredBatch) {
        const resultDiv = this.verificationResult;
        const statusEl = document.getElementById('result-status');
        const detailsEl = document.getElementById('result-details');
        const iconEl = resultDiv.querySelector('.result-icon i');

        const existingMessage = resultDiv.querySelector('.verification-message');
        if (existingMessage) existingMessage.remove();

        if (data.success && data.isAuthentic) {
            statusEl.textContent = 'Medicine Verified';
            detailsEl.innerHTML = `
                <strong>${data.productName || 'Unknown Medicine'}</strong> is authentic and safe to use.<br>
                <small>Batch: ${data.batchNumber} | Manufacture: ${data.manufactureDate} | Expiry: ${data.expiryDate} | Pharmacy: ${data.pharmacyName || 'Not assigned yet'}</small>
            `;
            iconEl.className = 'fas fa-check-circle';
            iconEl.style.color = 'blue';
            resultDiv.classList.add('authentic-result');
            resultDiv.classList.remove('invalid-result');
        } else {
            const statusText = data.isAuthentic === false ? 'Not Authentic' : 'Verification Failed';
            const message = data.message || 'This batch has expired.';
            statusEl.textContent = statusText;

            detailsEl.innerHTML = `
                <strong>Counterfeit Suspected</strong><br>
                ${message}<br>
                <small>Batch Entered: ${enteredBatch || data.batchNumber}</small>
            `;
            iconEl.className = 'fas fa-exclamation-triangle';
            iconEl.style.color = 'white';
            resultDiv.classList.add('invalid-result');
            resultDiv.classList.remove('authentic-result');

            if (data.status === 'Expired') {
                detailsEl.innerHTML += `<br><small style="color: var(--warning);">⚠️ This medicine has expired. Do not use.</small>`;
            }
        }

        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showResultMessage(message, isSuccess = false) {
        const resultDiv = this.verificationResult;
        const statusEl = document.getElementById('result-status');
        const detailsEl = document.getElementById('result-details');
        const iconEl = resultDiv.querySelector('.result-icon i');

        statusEl.textContent = isSuccess ? 'Success' : 'Error';
        detailsEl.innerHTML = `<strong>${message}</strong>`;
        iconEl.className = isSuccess ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
        iconEl.style.color = isSuccess ? 'var(--success)' : 'var(--danger)';

        resultDiv.classList.add(isSuccess ? 'authentic-result' : 'invalid-result');
        resultDiv.classList.remove(isSuccess ? 'invalid-result' : 'authentic-result');

        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    async startQRScanner() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            this.qrVideo.srcObject = stream;
            this.qrVideo.style.display = 'block';
            document.querySelector('.scanner-placeholder')?.style.setProperty('display', 'none');

            this.scanForQR();
        } catch (error) {
            console.error('Camera access denied', error);
            this.showResultMessage('Camera access is required for QR scanning. Please enable camera permissions.', false);
        }
    }

    scanForQR() {
        const canvas = document.getElementById('qr-canvas');
        const ctx = canvas.getContext('2d');

        const scan = () => {
            if (this.qrVideo.readyState === this.qrVideo.HAVE_ENOUGH_DATA) {
                canvas.height = this.qrVideo.videoHeight;
                canvas.width = this.qrVideo.videoWidth;
                ctx.drawImage(this.qrVideo, 0, 0, canvas.width, canvas.height);
            }
            requestAnimationFrame(scan);
        };
        scan();

        setTimeout(() => this.simulateQRDetection(), 3000);
    }

    simulateQRDetection() {
        const demoQRData = 'PHARMALEDGER-PCM5112025-DOLO paracetamol 500 mg';
        const batchNumber = demoQRData.match(/-([A-Z0-9]{8,})/)?.[1] || 'PCM5112025';

        const stream = this.qrVideo.srcObject;
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
        }
        this.qrVideo.style.display = 'none';
        document.querySelector('.scanner-placeholder')?.style.setProperty('display', 'block');

        this.handleManualVerificationForQR(batchNumber);
    }

    async handleManualVerificationForQR(batchNumber) {
        document.getElementById('batch-number').value = batchNumber;

        const submitButton = this.manualForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
        submitButton.disabled = true;

        try {
            const apiUrl = `http://127.0.0.1:5000/api/verify-batch?batch_number=${encodeURIComponent(batchNumber.toUpperCase())}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`Connection issue: ${response.status}`);
            }

            const data = await response.json();
            this.showVerificationResult(data, batchNumber);
        } catch (error) {
            this.showResultMessage(`QR Scan Error: ${error.message}`, false);
        } finally {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }
}

// Statistics Counter Animation
class StatsCounter {
    constructor() {
        this.counters = document.querySelectorAll('.stat-number[data-target]');
        this.init();
    }

    init() {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        this.counters.forEach(counter => observer.observe(counter));
    }

    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 16);
    }
}

// Scroll Progress Indicator
class ScrollProgress {
    constructor() {
        this.progressBar = document.getElementById('scroll-progress');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.updateProgress());
    }

    updateProgress() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = (scrollTop / scrollHeight) * 100;
        if (this.progressBar) {
            this.progressBar.style.width = `${progress}%`;
        }
    }
}

// Back to Top Button
class BackToTop {
    constructor() {
        this.button = document.getElementById('back-to-top');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.toggleVisibility());
        this.button?.addEventListener('click', () => this.scrollToTop());
    }

    toggleVisibility() {
        if (window.pageYOffset > 300) {
            this.button?.classList.add('visible');
        } else {
            this.button?.classList.remove('visible');
        }
    }

    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Form Handler (for contact form)
class FormHandler {
    constructor() {
        this.contactForm = document.getElementById('contact-form');
        this.init();
    }

    init() {
        this.contactForm?.addEventListener('submit', e => {
            e.preventDefault();
            this.handleContactForm();
        });
    }

    async handleContactForm() {
        const formData = new FormData(this.contactForm);
        const submitButton = this.contactForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;

        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitButton.disabled = true;

        try {
            await this.submitForm(formData);
            this.showMessage('Message sent successfully! We will get back to you soon.', 'success');
            this.contactForm.reset();
        } catch (error) {
            this.showError('Failed to send message. Please try again.');
        } finally {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    async submitForm(formData) {
        return new Promise(resolve => setTimeout(resolve, 2000));
    }

    showMessage(message, type) {
        let messageDiv = this.contactForm.querySelector('.form-message');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.className = `form-message form-message-${type}`;
            messageDiv.style.cssText = `
                padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;
                background: ${type === 'success' ? '#d1fae5' : '#fee2e2'};
                border: 1px solid ${type === 'success' ? '#a7f3d0' : '#fecaca'};
                color: ${type === 'success' ? '#065f46' : '#991b1b'};
            `;
            this.contactForm.appendChild(messageDiv);
        }
        messageDiv.textContent = message;
        const existingMessage = this.contactForm.querySelector('.form-message');
        if (existingMessage) existingMessage.remove();
        this.contactForm.appendChild(messageDiv);

        setTimeout(() => messageDiv.remove(), 5000);
    }

    showError(message) {
        this.showMessage(message, 'error');
    }
}

// Animation on Scroll
class ScrollAnimations {
    constructor() {
        this.animatedElements = document.querySelectorAll('.feature-card, .step-item, .stakeholder-card');
        this.init();
    }

    init() {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        this.animatedElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'all 0.6s ease';
            observer.observe(element);
        });
    }
}

// Utility Functions
const utils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    scrollToElement(elementId, offset = 80) {
        const element = document.getElementById(elementId);
        if (element) {
            const offsetTop = element.offsetTop - offset;
            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        }
    },

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
};

// Performance Monitoring
const performance = {
    trackPageLoad() {
        window.addEventListener('load', () => {
            const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
            console.log(`Page loaded in ${loadTime}ms`);
        });
    },

    trackCoreWebVitals() {
        new PerformanceObserver(entryList => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        new PerformanceObserver(entryList => {
            const firstInput = entryList.getEntries()[0];
            const fid = firstInput.processingStart - firstInput.startTime;
            console.log('FID:', fid);
        }).observe({ entryTypes: ['first-input', 'buffered-flag'] });
    }
};

// Initialize Application
class App {
    constructor() {
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
        } else {
            this.initializeComponents();
        }
    }

    initializeComponents() {
        try {
            this.themeManager = new ThemeManager();
            this.navbarManager = new NavbarManager();
            this.verificationManager = new VerificationManager();
            this.statsCounter = new StatsCounter();
            this.scrollProgress = new ScrollProgress();
            this.backToTop = new BackToTop();
            this.formHandler = new FormHandler();
            this.scrollAnimations = new ScrollAnimations();

            performance.trackPageLoad();
            performance.trackCoreWebVitals();

            this.initErrorHandling();

            console.log('PharmaLedger app initialized successfully');
        } catch (error) {
            console.error('Error initializing app', error);
        }
    }

    initErrorHandling() {
        window.addEventListener('error', event => {
            console.error('Global error', event.error);
        });

        window.addEventListener('unhandledrejection', event => {
            console.error('Unhandled promise rejection', event.reason);
            event.preventDefault();
        });
    }
}

// Start the application
const app = new App();

if (typeof module !== 'undefined') {
    module.exports = { App, utils };
}

// Service Worker (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('ServiceWorker registration successful'))
            .catch(error => console.log('ServiceWorker registration failed'));
    });
}
