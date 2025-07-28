import axios from 'axios';

class ZohoApiKeyService {
  constructor() {
    this.baseURL = 'https://www.zohoapis.com/crm/v3';
    this.apiKey = process.env.ZOHO_API_KEY;
  }

  /**
   * Create a new contact in Zoho CRM using API key
   * @param {object} contactData - Contact information
   * @returns {Promise<object>} - Created contact
   */
  async createContact(contactData) {
    try {
      if (!this.apiKey) {
        throw new Error('ZOHO_API_KEY environment variable is not set');
      }

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
          'Authorization': `Zoho-oauthtoken ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.data[0];
    } catch (error) {
      throw new Error(`Failed to create Zoho contact: ${error.message}`);
    }
  }

  /**
   * Create a new lead in Zoho CRM using API key
   * @param {object} leadData - Lead information
   * @returns {Promise<object>} - Created lead
   */
  async createLead(leadData) {
    try {
      if (!this.apiKey) {
        throw new Error('ZOHO_API_KEY environment variable is not set');
      }

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
          'Authorization': `Zoho-oauthtoken ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.data[0];
    } catch (error) {
      throw new Error(`Failed to create Zoho lead: ${error.message}`);
    }
  }

  /**
   * Search for contacts in Zoho CRM using API key
   * @param {string} searchTerm - Search term (email or phone)
   * @returns {Promise<Array>} - Matching contacts
   */
  async searchContacts(searchTerm) {
    try {
      if (!this.apiKey) {
        throw new Error('ZOHO_API_KEY environment variable is not set');
      }

      const response = await axios.get(`${this.baseURL}/Contacts/search`, {
        params: {
          email: searchTerm,
          phone: searchTerm
        },
        headers: {
          'Authorization': `Zoho-oauthtoken ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.data || [];
    } catch (error) {
      throw new Error(`Failed to search Zoho contacts: ${error.message}`);
    }
  }
}

export default new ZohoApiKeyService(); 