const { useState, useEffect } = React;

const LoginApp = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        username: ''
    });

    useEffect(() => {
        // If already logged in, redirect to main page
        if (window.AuthClient && window.AuthClient.isAuthenticated()) {
            window.location.href = '/index.html';
        }
    }, []);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const toggleMode = (e) => {
        e.preventDefault();
        setIsLoginMode(!isLoginMode);
        setErrorMsg('');
        setSuccessMsg('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        // reCAPTCHA check
        const captchaResponse = window.grecaptcha && window.grecaptcha.getResponse();
        if (!captchaResponse) {
            setErrorMsg('Please complete the captcha.');
            return;
        }

        if (!window.AuthClient) {
            setErrorMsg('Authentication client not found.');
            return;
        }

        const { email, password, confirmPassword, username } = formData;

        if (!email || !password) {
            setErrorMsg('Email and password are required');
            return;
        }

        if (!email.includes('@')) {
            setErrorMsg('Invalid email format');
            return;
        }

        if (!isLoginMode) {
            if (!confirmPassword || !username) {
                setErrorMsg('All fields are required');
                return;
            }
            if (password.length < 6) {
                setErrorMsg('Password must be at least 6 characters');
                return;
            }
            if (password !== confirmPassword) {
                setErrorMsg('Passwords do not match');
                return;
            }
            if (username.length < 2) {
                setErrorMsg('Username must be at least 2 characters');
                return;
            }
        }

        setIsLoading(true);

        try {
            let result;
            if (isLoginMode) {
                result = await window.AuthClient.login(email, password);
            } else {
                result = await window.AuthClient.signup(email, password, username);
            }

            if (result.success) {
                return (
                    <div className="login-container">
                        <form className="login-form" onSubmit={handleSubmit}>
                            <h2>{isLoginMode ? 'Login' : 'Register'}</h2>
                            {errorMsg && <div className="error-msg">{errorMsg}</div>}
                            {successMsg && <div className="success-msg">{successMsg}</div>}
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleInputChange}
                                autoComplete="email"
                            />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleInputChange}
                                autoComplete="current-password"
                            />
                            {!isLoginMode && (
                                <>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="Confirm Password"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        autoComplete="new-password"
                                    />
                                    <input
                                        type="text"
                                        name="username"
                                        placeholder="Username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        autoComplete="username"
                                    />
                                </>
                            )}
                            {/* reCAPTCHA widget */}
                            <div style={{ margin: '16px 0' }}>
                                <div className="g-recaptcha" data-sitekey="YOUR_RECAPTCHA_SITE_KEY"></div>
                            </div>
                            <button type="submit" disabled={isLoading}>
                                {isLoginMode ? 'Login' : 'Register'}
                            </button>
                            <button className="toggle-btn" onClick={toggleMode}>
                                {isLoginMode ? 'Need an account? Register' : 'Already have an account? Login'}
                            </button>
                        </form>
                    </div>

                );
    // ...existing code...

    const labelStyle = {
        display: 'block',
        marginBottom: '0.6rem',
        color: '#f8fafc',
        fontWeight: '600',
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    };

    const btnStyle = {
        width: '100%',
        padding: '1rem',
                                const captchaRef = React.useRef(null);
                                const [captchaReady, setCaptchaReady] = useState(false);
                                const [captchaId, setCaptchaId] = useState(null);

                                // Render reCAPTCHA widget after mount
                                useEffect(() => {
                                    const renderCaptcha = () => {
                                        if (window.grecaptcha && captchaRef.current && !captchaId) {
                                            const id = window.grecaptcha.render(captchaRef.current, {
                                                sitekey: 'YOUR_RECAPTCHA_SITE_KEY',
                                            });
                                            setCaptchaId(id);
                                            setCaptchaReady(true);
                                        }
                                    };
                                    if (window.grecaptcha) {
                                        renderCaptcha();
                                    } else {
                                        window.__onRecaptchaLoaded = renderCaptcha;
                                        const oldOnLoad = window.onload;
                                        window.onload = function() {
                                            if (oldOnLoad) oldOnLoad();
                                            if (window.__onRecaptchaLoaded) window.__onRecaptchaLoaded();
                                        };
                                    }
                                }, [captchaId]);

                                const resetCaptcha = () => {
                                    if (window.grecaptcha && captchaId !== null) {
                                        window.grecaptcha.reset(captchaId);
                                    }
                                };

                                const handleSubmit = async (e) => {
                                    e.preventDefault();
                                    setErrorMsg('');
                                    setSuccessMsg('');

                                    if (!captchaReady) {
                                        setErrorMsg('Captcha not loaded. Please wait.');
                                        return;
                                    }
                                    const captchaResponse = window.grecaptcha.getResponse(captchaId);
                                    if (!captchaResponse) {
                                        setErrorMsg('Please complete the captcha.');
                                        return;
                                    }

                                    // Verify captcha with backend
                                    let captchaValid = false;
                                    try {
                                        const verifyRes = await fetch('/api/verify-captcha', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ token: captchaResponse })
                                        });
                                        const verifyData = await verifyRes.json();
                                        captchaValid = verifyData.success;
                                    } catch (err) {
                                        setErrorMsg('Captcha verification failed.');
                                        resetCaptcha();
                                        return;
                                    }
                                    if (!captchaValid) {
                                        setErrorMsg('Captcha verification failed.');
                                        resetCaptcha();
                                        return;
                                    }

                                    if (!window.AuthClient) {
                                        setErrorMsg('Authentication client not found.');
                                        resetCaptcha();
                                        return;
                                    }

                                    const { email, password, confirmPassword, username } = formData;

                                    if (!email || !password) {
                                        setErrorMsg('Email and password are required');
                                        resetCaptcha();
                                        return;
                                    }

                                    if (!email.includes('@')) {
                                        setErrorMsg('Invalid email format');
                                        resetCaptcha();
                                        return;
                                    }

                                    if (!isLoginMode) {
                                        if (!confirmPassword || !username) {
                                            setErrorMsg('All fields are required');
                                            resetCaptcha();
                                            return;
                                        }
                                        if (password.length < 6) {
                                            setErrorMsg('Password must be at least 6 characters');
                                            resetCaptcha();
                                            return;
                                        }
                                        if (password !== confirmPassword) {
                                            setErrorMsg('Passwords do not match');
                                            resetCaptcha();
                                            return;
                                        }
                                        if (username.length < 2) {
                                            setErrorMsg('Username must be at least 2 characters');
                                            resetCaptcha();
                                            return;
                                        }
                                    }

                                    setIsLoading(true);

                                    try {
                                        let result;
                                        if (isLoginMode) {
                                            result = await window.AuthClient.login(email, password);
                                        } else {
                                            result = await window.AuthClient.signup(email, password, username);
                                        }

                                        if (result.success) {
                                            setSuccessMsg('Success! Redirecting...');
                                            setTimeout(() => {
                                                window.location.href = '/index.html';
                                            }, 1000);
                                        } else {
                                            setErrorMsg(result.error || 'Authentication failed');
                                            resetCaptcha();
                                        }
                                    } catch (err) {
                                        setErrorMsg('An error occurred.');
                                        resetCaptcha();
                                    } finally {
                                        setIsLoading(false);
                                    }
                                };
                            placeholder={isLoginMode ? "Enter your password" : "At least 6 characters"} 
                        />
                    </div>

                    <div style={{ display: isLoginMode ? 'none' : 'block' }}>
                        <label style={labelStyle}>Confirm Password</label>
                        <input 
                            type="password" 
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            style={inputStyle} 
                            placeholder="Confirm your password" 
                        />
                    </div>

                    <button type="submit" style={btnStyle} disabled={isLoading} 
                        onMouseOver={(e) => { if(!isLoading) e.target.style.transform = 'translateY(-2px)' }} 
                        onMouseOut={(e) => { if(!isLoading) e.target.style.transform = 'translateY(0)' }}>
                        {isLoading ? (isLoginMode ? 'Signing in...' : 'Creating Account...') : (isLoginMode ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                    <span>{isLoginMode ? "Don't have an account? " : "Already have an account? "}</span>
                    <a onClick={toggleMode} style={{ color: '#00f5d4', textDecoration: 'none', fontWeight: '600', cursor: 'pointer', transition: 'color 0.3s' }}>
                        {isLoginMode ? 'Sign up' : 'Sign in'}
                    </a>
                </div>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<LoginApp />);
