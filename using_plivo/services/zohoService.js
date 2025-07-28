import axios from 'axios';
import UserToken from '../models/userTokenModel.js';

class ZohoService {
  constructor() {
    this.baseURL = 'https://www.zohoapis.com/crm/v3';
    this.authURL = 'https://accounts.zoho.com/oauth/v2/token';
  }

  /**
   * Get Zoho access token for a user
   * @param {string} userId - User ID
   * @returns {Promise<string>} - Access token
   */
  async getAccessToken(userId) {
    try {
      const userToken = await UserToken.findOne({ 
        userId, 
        provider: 'zoho',
        isActive: true 
      });

      if (!userToken) {
        throw new Error('No active Zoho token found. Please connect your Zoho account first.');
      }

      // Check if token is expired
      if (userToken.tokenExpiry && new Date() > userToken.tokenExpiry) {
        // Refresh token
        const newToken = await this.refreshToken(userToken.refreshToken);
        return newToken;
      }

      return userToken.accessToken;
    } catch (error) {
      throw new Error(`Failed to get Zoho access token: ${error.message}`);
    }
  }

  /**
   * Refresh Zoho access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<string>} - New access token
   */
  async refreshToken(refreshToken) {
    try {
      const response = await axios.post(this.authURL, {
        refresh_token: refreshToken,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token'
      });

      return response.data.access_token;
    } catch (error) {
      throw new Error(`Failed to refresh Zoho token: ${error.message}`);
    }
  }

  /**
   * Create a new contact in Zoho CRM
   * @param {string} userId - User ID
   * @param {object} contactData - Contact information
   * @returns {Promise<object>} - Created contact
   */
  async createContact(userId, contactData) {
    try {
      const accessToken = await this.getAccessToken(userId);
      
      const response = await axios.post(`${this.baseURL}/Contacts`, {
        data: [{
          First_Name: contactData.firstName,
          Last_Name: contactData.lastName,
          Email: contactData.email,
          Phone: contactData.phone,
          Description: contactData.description || '',
          Lead_Source: 'Voice Call'
        }]
      }, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.data[0];
    } catch (error) {
      throw new Error(`Failed to create Zoho contact: ${error.message}`);
    }
  }

  /**
   * Create a new lead in Zoho CRM
   * @param {string} userId - User ID
   * @param {object} leadData - Lead information
   * @returns {Promise<object>} - Created lead
   */
  async createLead(userId, leadData) {
    try {
      const accessToken = await this.getAccessToken(userId);
      
      const response = await axios.post(`${this.baseURL}/Leads`, {
        data: [{
          First_Name: leadData.firstName,
          Last_Name: leadData.lastName,
          Email: leadData.email,
          Phone: leadData.phone,
          Company: leadData.company || '',
          Lead_Source: 'Voice Call',
          Description: leadData.description || '',
          Lead_Status: 'New'
        }]
      }, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.data[0];
    } catch (error) {
      throw new Error(`Failed to create Zoho lead: ${error.message}`);
    }
  }

  /**
   * Update contact in Zoho CRM
   * @param {string} userId - User ID
   * @param {string} contactId - Contact ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} - Updated contact
   */
  async updateContact(userId, contactId, updateData) {
    try {
      const accessToken = await this.getAccessToken(userId);
      
      const response = await axios.put(`${this.baseURL}/Contacts/${contactId}`, {
        data: [updateData]
      }, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.data[0];
    } catch (error) {
      throw new Error(`Failed to update Zoho contact: ${error.message}`);
    }
  }

  /**
   * Search for contacts in Zoho CRM
   * @param {string} userId - User ID
   * @param {string} searchTerm - Search term (email or phone)
   * @returns {Promise<Array>} - Matching contacts
   */
  async searchContacts(userId, searchTerm) {
    try {
      const accessToken = await this.getAccessToken(userId);
      
      const response = await axios.get(`${this.baseURL}/Contacts/search`, {
        params: {
          email: searchTerm,
          phone: searchTerm
        },
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.data || [];
    } catch (error) {
      throw new Error(`Failed to search Zoho contacts: ${error.message}`);
    }
  }

  /**
   * Create a deal/opportunity in Zoho CRM
   * @param {string} userId - User ID
   * @param {object} dealData - Deal information
   * @returns {Promise<object>} - Created deal
   */
  async createDeal(userId, dealData) {
    try {
      const accessToken = await this.getAccessToken(userId);
      
      const response = await axios.post(`${this.baseURL}/Deals`, {
        data: [{
          Deal_Name: dealData.name,
          Account_Name: dealData.accountName,
          Contact_Name: dealData.contactName,
          Amount: dealData.amount,
          Stage: dealData.stage || 'Qualification',
          Description: dealData.description || '',
          Lead_Source: 'Voice Call'
        }]
      }, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.data[0];
    } catch (error) {
      throw new Error(`Failed to create Zoho deal: ${error.message}`);
    }
  }
}

export default new ZohoService(); 