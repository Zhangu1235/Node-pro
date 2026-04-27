import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from './auth-routes.js';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/feedback
 * Create new feedback (requires authentication)
 */
router.post('/', verifyAuth, async (req, res) => {
  try {
    const { title, message, category } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!title || !message) {
      return res.status(400).json({
        error: 'Title and message are required'
      });
    }

    if (title.length < 5 || title.length > 255) {
      return res.status(400).json({
        error: 'Title must be between 5 and 255 characters'
      });
    }

    if (message.length < 10) {
      return res.status(400).json({
        error: 'Message must be at least 10 characters long'
      });
    }

    // Create feedback
    const { data: feedback, error } = await supabase
      .from('feedback')
      .insert([
        {
          user_id: userId,
          title,
          message,
          category: category || 'general',
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to create feedback',
        details: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/feedback
 * Get all feedback for the current user
 */
router.get('/', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: feedback, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch feedback',
        details: error.message
      });
    }

    res.json({
      success: true,
      feedback,
      count: feedback.length
    });
  } catch (error) {
    console.error('Fetch feedback error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/feedback/:id
 * Get specific feedback by ID
 */
router.get('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const { data: feedback, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !feedback) {
      return res.status(404).json({
        error: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/feedback/:id
 * Update feedback
 */
router.put('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { title, message, category, status } = req.body;

    // Check if feedback belongs to user
    const { data: existingFeedback } = await supabase
      .from('feedback')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingFeedback) {
      return res.status(404).json({
        error: 'Feedback not found'
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (message) updateData.message = message;
    if (category) updateData.category = category;
    if (status) updateData.status = status;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedFeedback, error } = await supabase
      .from('feedback')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to update feedback',
        details: error.message
      });
    }

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      feedback: updatedFeedback
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/feedback/:id
 * Delete feedback
 */
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if feedback belongs to user
    const { data: existingFeedback } = await supabase
      .from('feedback')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingFeedback) {
      return res.status(404).json({
        error: 'Feedback not found'
      });
    }

    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        error: 'Failed to delete feedback',
        details: error.message
      });
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
