const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client with service role key (for server-side operations)
let supabase = null;

if (SUPABASE_URL && SUPABASE_SECRET_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
        auth: {
            persistSession: false
        }
    });
} else {
    console.warn('Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Auth will not work.');
}

/**
 * Register a new user
 */
async function registerUser(email, password, username, captchaToken = '') {
    try {
        if (!supabase) {
            return { error: 'Supabase not configured', success: false };
        }
        void captchaToken;

        // Step 1: Create user via admin API (no confirmation email, no rate limits)
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { username }
        });

        if (error) {
            if (error.message?.toLowerCase().includes('already registered') ||
                error.message?.toLowerCase().includes('already been registered')) {
                return { success: false, error: 'An account with this email already exists.' };
            }
            return { success: false, error: error.message };
        }

        if (!data?.user) {
            return { success: false, error: 'Registration failed — please try again.' };
        }

        // Step 2: Immediately sign in server-side to get a real session.
        // This works regardless of whether Supabase "Confirm email" is on or off,
        // because admin.createUser already confirmed the email above.
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (loginError) {
            console.warn('[register] post-signup sign-in failed:', loginError.message);
        }

        // Step 3: Create profile row (non-fatal)
        const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([{
                user_id: data.user.id,
                username,
                email,
                created_at: new Date().toISOString()
            }]);

        if (profileError) {
            console.warn('[register] profile insert skipped:', profileError.message);
        }

        const result = {
            success: true,
            user: {
                id: data.user.id,
                email: data.user.email,
                username
            }
        };

        // Include session if server-side login worked
        if (loginData?.session) {
            result.session = {
                access_token:  loginData.session.access_token,
                refresh_token: loginData.session.refresh_token,
                expires_in:    loginData.session.expires_in
            };
        }

        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Login user
 */
async function loginUser(email, password, captchaToken = '') {
    try {
        if (!supabase) {
            return { error: 'Supabase not configured', success: false };
        }
        
        // Authenticate with Supabase
        const signInPayload = {
            email,
            password
        };
        if (captchaToken) {
            signInPayload.options = { captchaToken };
        }

        const { data, error } = await supabase.auth.signInWithPassword(signInPayload);

        if (error) {
            console.error('[loginUser] Supabase error:', error.status, error.message);
            return { success: false, error: error.message };
        }

        // Fetch user profile for additional info
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('user_id', data.user.id)
            .single();

        return {
            success: true,
            user: {
                id: data.user.id,
                email: data.user.email,
                username: profile?.username || data.user.email
            },
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_in: data.session.expires_in
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Verify a user session token
 */
async function verifyToken(token) {
    try {
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return { valid: false, user: null };
        }

        return { valid: true, user: data.user };
    } catch (error) {
        return { valid: false, user: null };
    }
}

/**
 * Middleware to verify authentication token
 */
async function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.authToken;

    if (!token) {
        return res.status(401).json({ error: 'No authentication token provided' });
    }

    const { valid, user } = await verifyToken(token);

    if (!valid) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
}

/**
 * Logout user (invalidate token)
 */
async function logoutUser(token) {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Refresh token
 */
async function refreshToken(refreshToken) {
    try {
        const { data, error } = await supabase.auth.refreshSession({


            refresh_token: refreshToken
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_in: data.session.expires_in
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Request password reset - uses Supabase native email
 */
async function requestPasswordReset(email, redirectUrl = 'http://localhost:3000/reset-password') {
    try {
        if (!supabase) {
            return { success: false, error: 'Supabase not configured' };
        }

        // Use Supabase's built-in password reset email
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl
        });

        if (error) {
            console.error('Password reset request error:', error);
            // For security, don't reveal if email exists
            return { success: true, message: 'If an account exists with this email, a password reset link has been sent' };
        }

        return { success: true, message: 'If an account exists with this email, a password reset link has been sent' };
    } catch (error) {
        console.error('Password reset request error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Reset password using Supabase token
 */
async function resetPassword(token, newPassword) {
    try {
        if (!supabase) {
            return { success: false, error: 'Supabase not configured' };
        }

        if (newPassword.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        // Verify and update password using token
        const { data, error: updateError } = await supabase.auth.updateUser(
            { password: newPassword },
            { jwt: token }
        );

        if (updateError) {
            console.error('Password update error:', updateError);
            return { success: false, error: 'Invalid or expired reset token. Please request a new password reset.' };
        }

        return { success: true, message: 'Password reset successfully' };
    } catch (error) {
        console.error('Password reset error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Submit user feedback - stored in Supabase
 */
async function submitFeedback(userId, email, subject, message, rating = null, category = 'general') {
    try {
        if (!supabase) {
            return { success: false, error: 'Supabase not configured' };
        }

        if (!subject || !message) {
            return { success: false, error: 'Subject and message are required' };
        }

        // Insert feedback into Supabase
        const { data: feedback, error: feedbackError } = await supabase
            .from('feedback')
            .insert([{
                user_id: userId,
                email,
                subject,
                message,
                rating: rating && rating >= 1 && rating <= 5 ? rating : null,
                category
            }])
            .select();

        if (feedbackError) {
            console.error('Feedback creation error:', feedbackError);
            return { success: false, error: 'Failed to submit feedback' };
        }

        return {
            success: true,
            message: 'Thank you for your feedback!',
            feedbackId: feedback[0].id
        };
    } catch (error) {
        console.error('Feedback submission error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get user feedback
 */
async function getUserFeedback(userId) {
    try {
        if (!supabase) {
            return { success: false, error: 'Supabase not configured' };
        }

        const { data: feedback, error } = await supabase
            .from('feedback')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching feedback:', error);
            return { success: false, error: error.message };
        }

        return { success: true, feedback };
    } catch (error) {
        console.error('Feedback retrieval error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    supabase,
    registerUser,
    loginUser,
    verifyToken,
    authMiddleware,
    logoutUser,
    refreshToken,
    requestPasswordReset,
    resetPassword,
    submitFeedback,
    getUserFeedback
};
