const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Simple file-based feedback storage
const feedbackFile = path.join(__dirname, '..', 'data', 'feedback.json');

// Ensure data directory exists
const dataDir = path.dirname(feedbackFile);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize feedback file if it doesn't exist
if (!fs.existsSync(feedbackFile)) {
  fs.writeFileSync(feedbackFile, JSON.stringify([], null, 2));
}

/**
 * GET all feedback
 */
function getAllFeedback() {
  try {
    const data = fs.readFileSync(feedbackFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading feedback file:', error);
    return [];
  }
}

/**
 * SAVE feedback
 */
function saveFeedback(feedbackList) {
  try {
    fs.writeFileSync(feedbackFile, JSON.stringify(feedbackList, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving feedback file:', error);
    return false;
  }
}

/**
 * POST /api/feedback
 * Create new feedback (open access)
 */
router.post('/', async (req, res) => {
  try {
    const { title, message, category } = req.body;
    const userId = req.user?.userId || 'anonymous-' + Date.now();

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

    // Create feedback object
    const feedback = {
      id: Date.now().toString(),
      user_id: userId,
      title,
      message,
      category: category || 'general',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Get existing feedback and add new one
    const allFeedback = getAllFeedback();
    allFeedback.push(feedback);

    // Save to file
    if (saveFeedback(allFeedback)) {
      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        feedback
      });
    } else {
      res.status(500).json({
        error: 'Failed to save feedback'
      });
    }
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * GET /api/feedback
 * Get all feedback (open access)
 */
router.get('/', async (req, res) => {
  try {
    const allFeedback = getAllFeedback();

    res.json({
      success: true,
      feedback: allFeedback,
      count: allFeedback.length
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * GET /api/feedback/:id
 * Get specific feedback by ID (open access)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allFeedback = getAllFeedback();
    const feedback = allFeedback.find(f => f.id === id);

    if (!feedback) {
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
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * PUT /api/feedback/:id
 * Update feedback (open access)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, category, status } = req.body;
    const allFeedback = getAllFeedback();
    const feedbackIndex = allFeedback.findIndex(f => f.id === id);

    if (feedbackIndex === -1) {
      return res.status(404).json({
        error: 'Feedback not found'
      });
    }

    // Update fields
    if (title) allFeedback[feedbackIndex].title = title;
    if (message) allFeedback[feedbackIndex].message = message;
    if (category) allFeedback[feedbackIndex].category = category;
    if (status) allFeedback[feedbackIndex].status = status;
    allFeedback[feedbackIndex].updated_at = new Date().toISOString();

    // Save to file
    if (saveFeedback(allFeedback)) {
      res.json({
        success: true,
        message: 'Feedback updated successfully',
        feedback: allFeedback[feedbackIndex]
      });
    } else {
      res.status(500).json({
        error: 'Failed to update feedback'
      });
    }
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * DELETE /api/feedback/:id
 * Delete feedback (open access)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allFeedback = getAllFeedback();
    const feedbackIndex = allFeedback.findIndex(f => f.id === id);

    if (feedbackIndex === -1) {
      return res.status(404).json({
        error: 'Feedback not found'
      });
    }

    // Remove feedback
    const deletedFeedback = allFeedback.splice(feedbackIndex, 1);

    // Save to file
    if (saveFeedback(allFeedback)) {
      res.json({
        success: true,
        message: 'Feedback deleted successfully',
        feedback: deletedFeedback[0]
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete feedback'
      });
    }
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
