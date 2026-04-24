// Login & Signup Form Handler

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const toggleAuthBtn = document.getElementById('toggleAuthBtn');
    const authFormContainer = document.getElementById('authFormContainer');

    // Track current mode
    let isLoginMode = true;

    /**
     * Toggle between login and signup modes
     */
    if (toggleAuthBtn) {
        toggleAuthBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isLoginMode = !isLoginMode;

            if (isLoginMode) {
                if (loginForm) loginForm.style.display = 'block';
                if (signupForm) signupForm.style.display = 'none';
                toggleAuthBtn.textContent = 'Create Account';
            } else {
                if (loginForm) loginForm.style.display = 'none';
                if (signupForm) signupForm.style.display = 'block';
                toggleAuthBtn.textContent = 'Sign In';
            }
        });
    }

    /**
     * Handle login form submission
     */
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail')?.value.trim();
            const password = document.getElementById('loginPassword')?.value;
            const errorMsg = document.getElementById('loginErrorMsg');
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            // Validation
            if (!email || !password) {
                if (errorMsg) errorMsg.textContent = 'Email and password are required';
                return;
            }

            if (!email.includes('@')) {
                if (errorMsg) errorMsg.textContent = 'Invalid email format';
                return;
            }

            // Clear previous errors
            if (errorMsg) errorMsg.textContent = '';

            // Disable button during submission
            const originalText = submitBtn?.textContent;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Signing in...';
            }

            // Attempt login
            const result = await AuthClient.login(email, password);

            if (result.success) {
                // Redirect to main page
                window.location.href = '/index.html';
            } else {
                if (errorMsg) {
                    errorMsg.textContent = result.error || 'Login failed';
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    }

    /**
     * Handle signup form submission
     */
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('signupEmail')?.value.trim();
            const password = document.getElementById('signupPassword')?.value;
            const confirmPassword = document.getElementById('signupConfirmPassword')?.value;
            const username = document.getElementById('signupUsername')?.value.trim();
            const errorMsg = document.getElementById('signupErrorMsg');
            const submitBtn = signupForm.querySelector('button[type="submit"]');

            // Validation
            if (!email || !password || !confirmPassword || !username) {
                if (errorMsg) errorMsg.textContent = 'All fields are required';
                return;
            }

            if (!email.includes('@')) {
                if (errorMsg) errorMsg.textContent = 'Invalid email format';
                return;
            }

            if (password.length < 6) {
                if (errorMsg) errorMsg.textContent = 'Password must be at least 6 characters';
                return;
            }

            if (password !== confirmPassword) {
                if (errorMsg) errorMsg.textContent = 'Passwords do not match';
                return;
            }

            if (username.length < 2) {
                if (errorMsg) errorMsg.textContent = 'Username must be at least 2 characters';
                return;
            }

            // Clear previous errors
            if (errorMsg) errorMsg.textContent = '';

            // Disable button during submission
            const originalText = submitBtn?.textContent;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating Account...';
            }

            // Attempt signup
            const result = await AuthClient.signup(email, password, username);

            if (result.success) {
                // Show success message and redirect after a brief delay
                if (errorMsg) {
                    errorMsg.style.color = '#4ade80';
                    errorMsg.textContent = `Welcome, ${username}! Redirecting...`;
                }
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 1500);
            } else {
                if (errorMsg) {
                    errorMsg.textContent = result.error || 'Signup failed';
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    }

    // If already logged in, redirect to main page
    if (AuthClient.isAuthenticated()) {
        // Check if we're on login page
        if (window.location.pathname === '/login.html') {
            window.location.href = '/index.html';
        }
    }
});
