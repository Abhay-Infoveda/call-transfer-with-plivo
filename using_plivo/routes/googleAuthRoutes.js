import express from 'express';
import { google } from 'googleapis';
import emailService from '../services/emailService.js';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

/**
 * @route GET /api/auth/google/connect
 * @desc Start OAuth2 flow for authenticated user
 * @access Private
 */
router.get('/connect', verifyToken, (req, res) => {
  const userId = req.user.id;
  
  // Store user ID in session or state parameter for callback
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://mail.google.com/',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/spreadsheets'
    ],
    prompt: 'consent',
    state: state
  });
  
  res.json({
    success: true,
    authUrl,
    message: 'Redirect user to this URL to connect Gmail'
  });
});

/**
 * @route GET /api/auth/google/callback
 * @desc OAuth2 callback - handle token exchange
 * @access Public (OAuth callback)
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code not provided'
      });
    }

    // Decode state to get user ID
    let userId;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid state parameter'
      });
    }

    // Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ auth: oAuth2Client, version: 'v2' });
    const { data } = await oauth2.userinfo.get();
    const email = data.email;

    // Save tokens to database
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://mail.google.com/',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/spreadsheets'
    ];

    await emailService.saveUserToken(userId, email, tokens, scopes);

    // Redirect to success page or return success response
    res.json({
      success: true,
      message: 'Gmail connected successfully',
      email,
      userId
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete OAuth flow'
    });
  }
});

/**
 * @route GET /api/auth/google/status
 * @desc Check OAuth connection status for authenticated user
 * @access Private
 */
router.get('/status', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const hasGmail = await emailService.hasConnectedGmail(userId);

    res.json({
      success: true,
      data: {
        hasConnectedGmail: hasGmail,
        email: req.user.email
      }
    });

  } catch (error) {
    console.error('OAuth status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get OAuth status'
    });
  }
});

/**
 * @route DELETE /api/auth/google/disconnect
 * @desc Disconnect user's Google account
 * @access Private
 */
router.delete('/disconnect', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await emailService.disconnectGmail(userId);

    res.json({
      success: true,
      message: 'Google account disconnected successfully'
    });

  } catch (error) {
    console.error('OAuth disconnect error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Google account'
    });
  }
});

export default router; 