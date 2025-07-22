import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import UserToken from '../models/userTokenModel.js';
import User from '../models/userModel.js';

class EmailService {
  constructor() {
    this.oAuth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
  }

  /**
   * Get or create OAuth client for a user
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @returns {Promise<google.auth.OAuth2>}
   */
  async getOAuthClient(userId, email) {
    try {
      // Find user token in database
      const userToken = await UserToken.findOne({ 
        userId, 
        email: email.toLowerCase(),
        isActive: true 
      });

      if (!userToken) {
        throw new Error(`No active OAuth token found for user ${email}. Please connect your Gmail account first.`);
      }

      // Get decrypted refresh token
      const refreshToken = await userToken.getDecryptedRefreshToken();
      
      // Set credentials
      this.oAuth2Client.setCredentials({ 
        refresh_token: refreshToken,
        access_token: userToken.accessToken,
        expiry_date: userToken.tokenExpiry
      });

      // Update last used timestamp
      userToken.lastUsed = new Date();
      await userToken.save();

      return this.oAuth2Client;
    } catch (error) {
      throw new Error(`Failed to get OAuth client: ${error.message}`);
    }
  }

  /**
   * Refresh access token if needed
   * @param {google.auth.OAuth2} oAuthClient - OAuth client
   * @param {string} userId - User ID
   * @returns {Promise<string>} - Access token
   */
  async refreshAccessToken(oAuthClient, userId) {
    try {
      const { token } = await oAuthClient.getAccessToken();
      
      // Update token in database
      await UserToken.findOneAndUpdate(
        { userId },
        { 
          accessToken: token,
          tokenExpiry: new Date(Date.now() + 3600000) // 1 hour from now
        }
      );

      return token;
    } catch (error) {
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  /**
   * Create nodemailer transport for a user
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @returns {Promise<nodemailer.Transporter>}
   */
  async createTransport(userId, email) {
    try {
      const oAuthClient = await this.getOAuthClient(userId, email);
      const accessToken = await this.refreshAccessToken(oAuthClient, userId);

      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: email,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: oAuthClient.credentials.refresh_token,
          accessToken: accessToken
        }
      });
    } catch (error) {
      throw new Error(`Failed to create email transport: ${error.message}`);
    }
  }

  /**
   * Send email for a specific user
   * @param {string} userId - User ID
   * @param {string} userEmail - User's email (sender)
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} text - Email text content
   * @param {string} html - Email HTML content (optional)
   * @returns {Promise<Object>} - Send result
   */
  async sendEmail(userId, userEmail, to, subject, text, html = null) {
    try {
      // Validate user exists and owns the email
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.email.toLowerCase() !== userEmail.toLowerCase()) {
        throw new Error('Email address does not match user account');
      }

      // Create transport
      const transport = await this.createTransport(userId, userEmail);

      // Prepare email options
      const mailOptions = {
        from: `${user.firstName || user.username} <${userEmail}>`,
        to,
        subject,
        text,
        html: html || `<p>${text}</p>`
      };

      // Send email
      const result = await transport.sendMail(mailOptions);
      
      // Log email sent (you might want to store this in a separate collection)
      console.log(`Email sent from ${userEmail} to ${to}: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        from: userEmail,
        to,
        subject
      };
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Save user OAuth token
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @param {Object} tokens - OAuth tokens
   * @param {Array<string>} scopes - OAuth scopes
   * @returns {Promise<UserToken>}
   */
  async saveUserToken(userId, email, tokens, scopes) {
    try {
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create or update user token
      const userToken = await UserToken.findOneAndUpdate(
        { userId },
        {
          email: email.toLowerCase(),
          refreshToken: tokens.refresh_token,
          accessToken: tokens.access_token,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          scopes,
          isActive: true,
          lastUsed: new Date()
        },
        { upsert: true, new: true }
      );

      return userToken;
    } catch (error) {
      throw new Error(`Failed to save user token: ${error.message}`);
    }
  }

  /**
   * Check if user has connected Gmail
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async hasConnectedGmail(userId) {
    try {
      const userToken = await UserToken.findOne({ 
        userId, 
        isActive: true,
        scopes: { $in: ['https://mail.google.com/'] }
      });
      return !!userToken;
    } catch (error) {
      return false;
    }
  }

  /**
   * Disconnect user's Gmail
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async disconnectGmail(userId) {
    try {
      await UserToken.findOneAndUpdate(
        { userId },
        { isActive: false }
      );
      return true;
    } catch (error) {
      throw new Error(`Failed to disconnect Gmail: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new EmailService(); 