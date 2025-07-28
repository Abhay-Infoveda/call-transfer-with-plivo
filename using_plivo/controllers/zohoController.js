import zohoService from '../services/zohoService.js';

/**
 * Create a new contact from call data
 * @route POST /api/zoho/contacts
 * @access Private
 */
export const createContactFromCall = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email, phone, description, callId } = req.body;

    if (!firstName || !phone) {
      return res.status(400).json({
        success: false,
        error: 'First name and phone number are required'
      });
    }

    const contactData = {
      firstName,
      lastName: lastName || '',
      email: email || '',
      phone,
      description: description || `Contact created from voice call: ${callId || 'Unknown'}`
    };

    const contact = await zohoService.createContact(userId, contactData);

    res.status(201).json({
      success: true,
      message: 'Contact created successfully in Zoho CRM',
      data: contact
    });

  } catch (error) {
    console.error('Error creating Zoho contact:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a new lead from call data
 * @route POST /api/zoho/leads
 * @access Private
 */
export const createLeadFromCall = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email, phone, company, description, callId } = req.body;

    if (!firstName || !phone) {
      return res.status(400).json({
        success: false,
        error: 'First name and phone number are required'
      });
    }

    const leadData = {
      firstName,
      lastName: lastName || '',
      email: email || '',
      phone,
      company: company || '',
      description: description || `Lead created from voice call: ${callId || 'Unknown'}`
    };

    const lead = await zohoService.createLead(userId, leadData);

    res.status(201).json({
      success: true,
      message: 'Lead created successfully in Zoho CRM',
      data: lead
    });

  } catch (error) {
    console.error('Error creating Zoho lead:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Search for existing contacts
 * @route GET /api/zoho/contacts/search
 * @access Private
 */
export const searchContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { searchTerm } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Search term is required'
      });
    }

    const contacts = await zohoService.searchContacts(userId, searchTerm);

    res.json({
      success: true,
      data: contacts
    });

  } catch (error) {
    console.error('Error searching Zoho contacts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update contact information
 * @route PUT /api/zoho/contacts/:contactId
 * @access Private
 */
export const updateContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;
    const updateData = req.body;

    if (!contactId) {
      return res.status(400).json({
        success: false,
        error: 'Contact ID is required'
      });
    }

    const contact = await zohoService.updateContact(userId, contactId, updateData);

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: contact
    });

  } catch (error) {
    console.error('Error updating Zoho contact:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a deal/opportunity from call data
 * @route POST /api/zoho/deals
 * @access Private
 */
export const createDealFromCall = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      name, 
      accountName, 
      contactName, 
      amount, 
      stage, 
      description, 
      callId 
    } = req.body;

    if (!name || !contactName) {
      return res.status(400).json({
        success: false,
        error: 'Deal name and contact name are required'
      });
    }

    const dealData = {
      name,
      accountName: accountName || '',
      contactName,
      amount: amount || 0,
      stage: stage || 'Qualification',
      description: description || `Deal created from voice call: ${callId || 'Unknown'}`
    };

    const deal = await zohoService.createDeal(userId, dealData);

    res.status(201).json({
      success: true,
      message: 'Deal created successfully in Zoho CRM',
      data: deal
    });

  } catch (error) {
    console.error('Error creating Zoho deal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get Zoho integration status
 * @route GET /api/zoho/status
 * @access Private
 */
export const getZohoStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Try to get access token to check if integration is working
    const accessToken = await zohoService.getAccessToken(userId);
    
    res.json({
      success: true,
      connected: true,
      message: 'Zoho CRM integration is active'
    });

  } catch (error) {
    res.json({
      success: true,
      connected: false,
      message: 'Zoho CRM integration is not connected'
    });
  }
}; 