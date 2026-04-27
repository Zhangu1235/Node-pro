import express from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  extractToken,
  isValidEmail,
  validatePassword
} from '../lib/auth-utils.js';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/auth/signup
 * Register a new user with email and password
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user in database
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: passwordHash
        }
      ])
      .select()
      .single();

    if (createError) {
      return res.status(500).json({
        error: 'Failed to create user',
        details: createError.message
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError || !user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', async (req, res) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        error: 'No token provided'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }

    // Fetch user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * Middleware to verify authentication
 */
export function verifyAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      error: 'No token provided'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  req.user = decoded;
  next();
}

export default router;
