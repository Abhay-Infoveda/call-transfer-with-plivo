import emailService from '../services/emailService.js';
import { validationResult } from 'express-validator';

/**
 * Send email for authenticated user
 * @route POST /api/email/send
 * @access Private
 */
export const sendEmail = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { to, subject, text, html } = req.body;
    const userId = req.user.id; // From auth middleware
    const userEmail = req.user.email; // From auth middleware

    // Check if user has connected Gmail
    const hasGmail = await emailService.hasConnectedGmail(userId);
    if (!hasGmail) {
      return res.status(400).json({
        success: false,
        error: 'Gmail not connected. Please connect your Gmail account first.',
        action: 'connect_gmail'
      });
    }

    // Send email
    const result = await emailService.sendEmail(
      userId, 
      userEmail, 
      to, 
      subject, 
      text, 
      html
    );

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email'
    });
  }
};

/**
 * Check if user has connected Gmail
 * @route GET /api/email/status
 * @access Private
 */
export const getEmailStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const hasGmail = await emailService.hasConnectedGmail(userId);

    res.status(200).json({
      success: true,
      data: {
        hasConnectedGmail: hasGmail,
        email: req.user.email
      }
    });

  } catch (error) {
    console.error('Email status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get email status'
    });
  }
};

/**
 * Disconnect user's Gmail
 * @route DELETE /api/email/disconnect
 * @access Private
 */
export const disconnectGmail = async (req, res) => {
  try {
    const userId = req.user.id;
    await emailService.disconnectGmail(userId);

    res.status(200).json({
      success: true,
      message: 'Gmail disconnected successfully'
    });

  } catch (error) {
    console.error('Gmail disconnect error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to disconnect Gmail'
    });
  }
};

/**
 * Get user's email history (optional feature)
 * @route GET /api/email/history
 * @access Private
 */
export const getEmailHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // TODO: Implement email history collection and retrieval
    // This would require storing sent emails in a separate collection

    res.status(200).json({
      success: true,
      data: {
        emails: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      }
    });

  } catch (error) {
    console.error('Email history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get email history'
    });
  }
}; 