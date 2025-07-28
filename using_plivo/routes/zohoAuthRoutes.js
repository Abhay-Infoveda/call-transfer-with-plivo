import express from 'express';
import axios from 'axios';
import UserToken from '../models/userTokenModel.js';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/auth/zoho/connect
 * @desc Start OAuth2 flow for Zoho
 * @access Private
 */
router.get('/connect', verifyToken, (req, res) => {
  const userId = req.user.id;
  
  // Store user ID in state parameter for callback
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  console.log('ZOHO_REDIRECT_URI:', process.env.ZOHO_REDIRECT_URI);
  console.log('ZOHO_CLIENT_ID:', process.env.ZOHO_CLIENT_ID);
  console.log('ZOHO_CLIENT_SECRET:', process.env.ZOHO_CLIENT_SECRET ? 'SET' : 'NOT SET');
  
  const authUrl = `https://accounts.zoho.in/oauth/v2/auth?` +
    `response_type=code&` +
    `client_id=${process.env.ZOHO_CLIENT_ID}&` +
    `scope=ZohoCRM.modules.contacts.read&` +
    `redirect_uri=${process.env.ZOHO_REDIRECT_URI}`;
  
  console.log('Generated authUrl:', authUrl);
  
  res.json({
    success: true,
    authUrl,
    message: 'Redirect user to this URL to connect Zoho CRM'
  });
});

/**
 * @route GET /api/auth/zoho/callback
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
    const tokenResponse = await axios.post('https://accounts.zoho.com/oauth/v2/token', {
      code,
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      redirect_uri: process.env.ZOHO_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const tokens = tokenResponse.data;
    
    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + (tokens.expires_in * 1000));

    // Save tokens to database
    await UserToken.findOneAndUpdate(
      { userId, provider: 'zoho' },
      {
        userId,
        provider: 'zoho',
        email: 'zoho-integration', // Placeholder since Zoho doesn't provide email in token response
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry,
        scopes: ['ZohoCRM.modules.ALL', 'ZohoCRM.settings.ALL'],
        isActive: true,
        lastUsed: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Zoho CRM connected successfully',
      userId
    });

  } catch (error) {
    console.error('Zoho OAuth callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete Zoho OAuth flow'
    });
  }
});

/**
 * @route GET /api/auth/zoho/disconnect
 * @desc Disconnect Zoho integration
 * @access Private
 */
router.get('/disconnect', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    await UserToken.findOneAndUpdate(
      { userId, provider: 'zoho' },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Zoho CRM disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Zoho:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Zoho integration'
    });
  }
});

export default router; 