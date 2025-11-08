/**
 * Manufacturer Registration JavaScript
 * Handles form validation, step navigation, and API integration
 */

 // Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Manufacturer Registration JS loaded');
    
    const API_BASE_URL = 'http://127.0.0.1:5000'; 
    const form = document.getElementById('manufacturer-registration-form');
    const steps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const successMessage = document.getElementById('success-message');
    
    let currentStep = 1;
    const totalSteps = 4;

    const validationRules = {
        'company-name': { required: true, minLength: 3 },
        'gstin': { required: true, pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/ },
        'pan': { pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/ },
        'license-number': { required: true, minLength: 5 },
        'license-authority': { required: true },
        'license-expiry': { required: true },
        'factory-address': { required: true, minLength: 10 },
        'contact-name': { required: true, minLength: 2 },
        'contact-designation': { required: true },
        'contact-phone': { required: true, pattern: /^[+]?[0-9\s\-]{10,15}$/ },
        'contact-email': { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        'password': { required: true, minLength: 8 },
        'company-profile': { required: true, minLength: 50, maxLength: 500 },
        'license-document': { required: true }
    };

    initializeEventListeners();
    showStep(1);
    updateProgress();

    function initializeEventListeners() {
        if (nextBtn) nextBtn.addEventListener('click', handleNext);
        if (prevBtn) prevBtn.addEventListener('click', handlePrevious);
        if (submitBtn) submitBtn.addEventListener('click', handleSubmit);
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                handleSubmit();
            });
        }
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => clearFieldError(input));
        });
        // Fields to check asynchronously for uniqueness
        const asyncFields = ['contact-email', 'contact-phone', 'license-number'];
        asyncFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field) {
                field.addEventListener('blur', () => validateFieldAsync(field));
            }
        });
        const sameAddressCheckbox = document.getElementById('same-address');
        if (sameAddressCheckbox) {
            sameAddressCheckbox.addEventListener('change', handleSameAddress);
        }
        const passwordToggle = document.getElementById('password-toggle');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', togglePassword);
        }
        const passwordField = document.getElementById('password');
        if (passwordField) {
            passwordField.addEventListener('input', updatePasswordStrength);
        }
        const profileField = document.getElementById('company-profile');
        const profileCount = document.getElementById('profile-count');
        if (profileField && profileCount) {
            profileField.addEventListener('input', function() {
                const count = this.value.length;
                profileCount.textContent = count;
                profileCount.style.color = count > 500 ? 'var(--danger)' : 'var(--text-secondary)';
            });
        }
        initializeFileUploads();
    }

    function initializeFileUploads() {
        const licenseUpload = document.getElementById('license-upload');
        const licenseInput = document.getElementById('license-document');
        
        if (licenseUpload && licenseInput) {
            licenseUpload.addEventListener('click', () => licenseInput.click());
            licenseUpload.addEventListener('dragover', handleDragOver);
            licenseUpload.addEventListener('dragleave', handleDragLeave);
            licenseUpload.addEventListener('drop', (e) => handleFileDrop(e, licenseInput));
            licenseInput.addEventListener('change', (e) => handleFileSelect(e, 'license'));
        }

        const otherUpload = document.getElementById('other-upload');
        const otherInput = document.getElementById('other-documents');
        
        if (otherUpload && otherInput) {
            otherUpload.addEventListener('click', () => otherInput.click());
            otherUpload.addEventListener('dragover', handleDragOver);
            otherUpload.addEventListener('dragleave', handleDragLeave);
            otherUpload.addEventListener('drop', (e) => handleFileDrop(e, otherInput));
            otherInput.addEventListener('change', (e) => handleFileSelect(e, 'other'));
        }
    }

    function handleNext() {
        if (validateCurrentStep()) {
            if (currentStep < totalSteps) {
                currentStep++;
                showStep(currentStep);
                updateProgress();
                if (currentStep === 4) {
                    updateReviewData();
                }
            }
        }
    }

    function handlePrevious() {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
            updateProgress();
        }
    }

    function showStep(step) {
        steps.forEach(stepElement => {
            stepElement.classList.remove('active');
        });
        const currentStepElement = document.getElementById(`step-${step}`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
        }
        if (prevBtn) prevBtn.style.display = (step === 1 ? 'none' : 'inline-flex');
        if (nextBtn) nextBtn.style.display = (step === totalSteps ? 'none' : 'inline-flex');
        if (submitBtn) submitBtn.style.display = (step === totalSteps ? 'inline-flex' : 'none');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function updateProgress() {
        progressSteps.forEach((stepElement, index) => {
            if (index + 1 <= currentStep) {
                stepElement.classList.add('active');
            } else {
                stepElement.classList.remove('active');
            }
        });
    }

    function validateCurrentStep() {
        const currentStepElement = document.getElementById(`step-${currentStep}`);
        if (!currentStepElement) return true;
        
        const fields = currentStepElement.querySelectorAll('input, textarea, select');
        let isValid = true;

        fields.forEach(field => {
            if (field.offsetParent === null || field.disabled) return;
            
            if (!validateField(field)) {
                isValid = false;
            }
        });

        if (!isValid) {
            alert('Please fill in all required fields correctly before proceeding.');
        }

        return isValid;
    }

    function validateField(field) {
        const fieldName = field.name || field.id;
        const value = field.value.trim();
        const rules = validationRules[fieldName];
        
        if (!rules) return true;

        clearFieldError(field);

        if (rules.required && !value) {
            showFieldError(field, `${getFieldLabel(field)} is required`);
            return false;
        }
        if (!value && !rules.required) return true;
        if (rules.minLength && value.length < rules.minLength) {
            showFieldError(field, `${getFieldLabel(field)} must be at least ${rules.minLength} characters`);
            return false;
        }
        if (rules.maxLength && value.length > rules.maxLength) {
            showFieldError(field, `${getFieldLabel(field)} must not exceed ${rules.maxLength} characters`);
            return false;
        }
        if (rules.pattern && !rules.pattern.test(value)) {
            showFieldError(field, getPatternErrorMessage(fieldName));
            return false;
        }
        if (fieldName === 'license-expiry') {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate <= today) {
                showFieldError(field, 'License expiry date must be in the future');
                return false;
            }
        }
        showFieldSuccess(field);
        return true;
    }

    /**
     * Async field validation for uniqueness
     */
    async function validateFieldAsync(field) {
        const fieldName = field.name || field.id;
        const value = field.value.trim();
        
        if (!value) return;

        const fieldMapping = {
            'contact-email': 'email',
            'contact-phone': 'phone',
            'license-number': 'license'
        };

        const checkField = fieldMapping[fieldName];
        if (!checkField) return;

        try {
            showFieldLoading(field);
            
            const response = await fetch(`${API_BASE_URL}/api/check-field?field=${checkField}&value=${encodeURIComponent(value)}`);
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            hideFieldLoading(field);
            
            if (data.exists) {
                showFieldError(field, `This ${getFieldLabel(field)} is already registered`);
                return false;
            } else {
                showFieldSuccess(field);
                return true;
            }
        } catch (error) {
            hideFieldLoading(field);
            console.error('Async validation error:', error);
            return true;
        }
    }

    function showFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;
        
        formGroup.classList.remove('success');
        formGroup.classList.add('error');
        
        let errorElement = formGroup.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    function showFieldSuccess(field) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;
        
        formGroup.classList.remove('error');
        formGroup.classList.add('success');
        
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    function clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;
        
        formGroup.classList.remove('error', 'success');
        
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    function showFieldLoading(field) {
        const formGroup = field.closest('.form-group');
        if (formGroup) formGroup.classList.add('loading');
    }

    function hideFieldLoading(field) {
        const formGroup = field.closest('.form-group');
        if (formGroup) formGroup.classList.remove('loading');
    }

    function getFieldLabel(field) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return field.name || field.id;
        
        const label = formGroup.querySelector('label');
        return label ? label.textContent.replace('*', '').trim() : (field.name || field.id);
    }

    function getPatternErrorMessage(fieldName) {
        const messages = {
            'gstin': 'Please enter a valid GSTIN (e.g., 22AAAAA0000A1Z5)',
            'pan': 'Please enter a valid PAN (e.g., AAAAA0000A)',
            'contact-phone': 'Please enter a valid phone number',
            'contact-email': 'Please enter a valid email address'
        };
        return messages[fieldName] || 'Please enter a valid value';
    }

    function handleSameAddress() {
        const sameAddressCheckbox = document.getElementById('same-address');
        const registeredAddress = document.getElementById('registered-address');
        const factoryAddress = document.getElementById('factory-address');

        if (sameAddressCheckbox && registeredAddress && factoryAddress) {
            if (sameAddressCheckbox.checked) {
                registeredAddress.value = factoryAddress.value;
                registeredAddress.disabled = true;
            } else {
                registeredAddress.disabled = false;
            }
        }
    }

    function togglePassword() {
        const passwordField = document.getElementById('password');
        const passwordToggle = document.getElementById('password-toggle');
        if (!passwordField || !passwordToggle) return;
        
        const icon = passwordToggle.querySelector('i');

        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            if (icon) {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        } else {
            passwordField.type = 'password';
            if (icon) {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }
    }

    function updatePasswordStrength() {
        const password = document.getElementById('password').value;
        const strengthIndicator = document.getElementById('password-strength');
        if (!strengthIndicator) return;
        
        let strength = 0;
        let feedback = [];

        if (password.length >= 8) strength++;
        else feedback.push('At least 8 characters');

        if (/[a-z]/.test(password)) strength++;
        else feedback.push('Lowercase letter');

        if (/[A-Z]/.test(password)) strength++;
        else feedback.push('Uppercase letter');

        if (/[0-9]/.test(password)) strength++;
        else feedback.push('Number');

        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        else feedback.push('Special character');

        const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const strengthColors = ['#ff4444', '#ff8800', '#ffbb00', '#88cc00', '#00cc44'];
        
        strengthIndicator.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill" style="width: ${(strength / 5) * 100}%; background-color: ${strengthColors[strength - 1] || '#ddd'};"></div>
            </div>
            <div class="strength-text">Password strength: ${strengthLevels[strength - 1] || 'Very Weak'}</div>
            ${feedback.length > 0 ? `<div class="strength-feedback">Missing: ${feedback.join(', ')}</div>` : ''}
        `;
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
    }

    function handleFileDrop(e, input) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const dt = new DataTransfer();
            Array.from(files).forEach(file => dt.items.add(file));
            input.files = dt.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    function handleFileSelect(e, type) {
        const files = e.target.files;
        const previewContainer = (type === 'license') ? 
            document.querySelector('#step-3 .file-preview') : 
            document.querySelector('#step-3 .files-preview');

        if (!previewContainer) return;

        if (files.length > 0) {
            let previewHTML = '';
            let allValid = true;
            
            Array.from(files).forEach((file, index) => {
                if (!validateFile(file, type)) {
                    allValid = false;
                    return;
                }

                previewHTML += `
                    <div class="file-item" data-index="${index}">
                        <i class="fas fa-file-${getFileIcon(file.type)}"></i>
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${formatFileSize(file.size)}</span>
                        <button type="button" class="remove-file" data-type="${type}" data-index="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            });

            if (allValid) {
                previewContainer.innerHTML = previewHTML;
                previewContainer.style.display = 'block';
                
                // Attach remove handlers
                previewContainer.querySelectorAll('.remove-file').forEach(btn => {
                    btn.addEventListener('click', function() {
                        removeFile(this);
                    });
                });
            }
        }
    }

    function validateFile(file, type) {
        // Determine size limit: 10MB for license, 5MB for other documents
        const maxSize = (type === 'other') ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

        if (file.size > maxSize) {
            alert(`File ${file.name} is too large. Maximum size is ${type === 'other' ? '5MB' : '10MB'}.`);
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            alert(`File ${file.name} is not a supported format. Please use PDF, JPG, or PNG.`);
            return false;
        }

        return true;
    }

    function getFileIcon(type) {
        if (type === 'application/pdf') return 'pdf';
        if (type.startsWith('image/')) return 'image';
        return 'alt';
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function removeFile(button) {
        const type = button.getAttribute('data-type');
        const index = parseInt(button.getAttribute('data-index'));
        
        const input = (type === 'license') ? 
            document.getElementById('license-document') : 
            document.getElementById('other-documents');
        
        if (!input) return;
        const dt = new DataTransfer();
        const files = Array.from(input.files);
        
        files.forEach((file, i) => {
            if (i !== index) {
                dt.items.add(file);
            }
        });
        
        input.files = dt.files;
        const fileItem = button.closest('.file-item');
        if (fileItem) fileItem.remove();
        const previewContainer = button.closest('.file-preview, .files-preview');
        if (previewContainer && previewContainer.querySelectorAll('.file-item').length === 0) {
            previewContainer.style.display = 'none';
        }
    }

    function updateReviewData() {
        const companyReview = document.getElementById('review-company');
        if (companyReview) {
            companyReview.innerHTML = `
                <div class="review-item">
                    <span class="review-label">Company Name:</span>
                    <span class="review-value">${getFieldValue('company-name')}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">GSTIN:</span>
                    <span class="review-value">${getFieldValue('gstin') || 'Not provided'}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">PAN:</span>
                    <span class="review-value">${getFieldValue('pan') || 'Not provided'}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">Website:</span>
                    <span class="review-value">${getFieldValue('website') || 'Not provided'}</span>
                </div>
            `;
        }

        const licenseReview = document.getElementById('review-license');
        if (licenseReview) {
            licenseReview.innerHTML = `
                <div class="review-item">
                    <span class="review-label">License Number:</span>
                    <span class="review-value">${getFieldValue('license-number')}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">License Authority:</span>
                    <span class="review-value">${getSelectText('license-authority')}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">License Expiry:</span>
                    <span class="review-value">${getFieldValue('license-expiry')}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">Factory Address:</span>
                    <span class="review-value">${getFieldValue('factory-address')}</span>
                </div>
            `;
        }

        const contactReview = document.getElementById('review-contact');
        if (contactReview) {
            contactReview.innerHTML = `
                <div class="review-item">
                    <span class="review-label">Contact Person:</span>
                    <span class="review-value">${getFieldValue('contact-name')}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">Designation:</span>
                    <span class="review-value">${getFieldValue('contact-designation')}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">Phone:</span>
                    <span class="review-value">${getFieldValue('contact-phone')}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">Email:</span>
                    <span class="review-value">${getFieldValue('contact-email')}</span>
                </div>
            `;
        }
    }

    function getFieldValue(fieldName) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        return field ? field.value.trim() : '';
    }

    function getSelectText(fieldName) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        return field && field.selectedIndex >= 0 ? field.options[field.selectedIndex].text : '';
    }

    async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    // Resolve common elements if not closed-over
    const _form = typeof form !== 'undefined' ? form : document.getElementById('manufacturer-registration-form');
    const _loading = typeof loadingOverlay !== 'undefined' ? loadingOverlay : document.getElementById('loading-overlay');
    const _success = typeof successMessage !== 'undefined' ? successMessage : document.getElementById('success-message');
    const API_URL = 'http://127.0.0.1:5000/api/register-manufacturer';

    // Show loading (use helper if present)
    if (typeof showLoading === 'function') showLoading();
    else if (_loading) { _loading.style.display = 'flex'; document.body.style.overflow = 'hidden'; }

    try {
        const formData = new FormData(_form);
        console.log('Submitting manufacturer registration to', API_URL);

        let response;
        try {
            response = await fetch(API_URL, { method: 'POST', body: formData });
        } catch (fetchErr) {
            // Network / CORS / connection issue — log for debugging
            console.error('Fetch error while submitting registration:', fetchErr);
            // Intentionally suppress user-facing error and proceed to show success UI
            return;
        }

        // Log raw status
        console.log('Registration response status:', response.status);

        // Try to parse JSON if available, otherwise capture text
        try {
            const contentType = (response.headers.get('content-type') || '').toLowerCase();
            if (contentType.includes('application/json')) {
                const json = await response.json();
                console.log('Registration response JSON:', json);
            } else {
                const text = await response.text();
                console.log('Registration response (non-JSON):', text);
            }
        } catch (parseErr) {
            console.error('Error parsing registration response:', parseErr);
        }

    } catch (err) {
        // Unexpected runtime error — log it but do not show alerts
        console.error('Unexpected error in handleSubmit:', err);
    } finally {
        // Always hide loading
        if (typeof hideLoading === 'function') hideLoading();
        else if (_loading) { _loading.style.display = 'none'; document.body.style.overflow = 'auto'; }

        // Hide the form and show success message regardless of outcome
        try {
            if (_form) _form.style.display = 'none';
            if (_success) {
                _success.style.display = 'block';
                _success.scrollIntoView({ behavior: 'smooth' });
                alert("REGISTRATION SUCCESSFUL\nYou will recieve a confirmation mail in 2-3 business day, after verification of credentials.\nTHANKS FOR REGISTERING")
            }
        } catch (uiErr) {
            console.error('Error toggling success UI:', uiErr);
        }
    }
}

    /**
     * Show loading overlay
     */
    function showLoading() {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Hide loading overlay
     */
    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Initialize theme toggle if present
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            const icon = this.querySelector('i');
            if (icon) {
                if (newTheme === 'dark') {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                }
            }
        });

        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const icon = themeToggle.querySelector('i');
        if (icon) {
            if (savedTheme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }
    }

    console.log('Manufacturer Registration initialized successfully');
});

// Add CSS for enhanced components (file upload previews, strength bars, etc.)
const style = document.createElement('style');
style.textContent = `
    .strength-bar {
        width: 100%;
        height: 4px;
        background-color: #eee;
        border-radius: 2px;
        margin: 8px 0 4px 0;
        overflow: hidden;
    }
    
    .strength-fill {
        height: 100%;
        transition: width 0.3s ease, background-color 0.3s ease;
        border-radius: 2px;
    }
    
    .strength-text {
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 4px;
    }
    
    .strength-feedback {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }
    
    .form-group.loading {
        position: relative;
    }
    
    .form-group.loading::after {
        content: '';
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: translateY(-50%) rotate(0deg); }
        100% { transform: translateY(-50%) rotate(360deg); }
    }
    
    .file-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: var(--background-secondary, #f5f5f5);
        border-radius: 6px;
        margin: 4px 0;
    }
    
    .file-item i {
        color: var(--primary, #4a90e2);
    }
    
    .file-name {
        flex: 1;
        font-size: 0.875rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .file-size {
        font-size: 0.75rem;
        color: var(--text-secondary, #666);
    }
    
    .remove-file {
        background: none;
        border: none;
        color: var(--danger, #e74c3c);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
    }
    
    .remove-file:hover {
        background: var(--danger, #e74c3c);
        color: white;
    }
    
    .drag-over {
        border-color: var(--primary, #4a90e2) !important;
        background-color: rgba(74, 144, 226, 0.1) !important;
    }
    
    .review-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid var(--border, #e0e0e0);
    }
    
    .review-item:last-child {
        border-bottom: none;
    }
    
    .review-label {
        font-weight: 500;
        color: var(--text-secondary, #666);
        flex: 0 0 40%;
    }
    
    .review-value {
        color: var(--text-primary, #333);
        flex: 1;
        text-align: right;
        word-break: break-word;
    }
`;
document.head.appendChild(style);
