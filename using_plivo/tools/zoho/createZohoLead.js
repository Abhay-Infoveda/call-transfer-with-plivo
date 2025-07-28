import zohoService from '../../services/zohoService.js';

/**
 * Create a new lead in Zoho CRM from voice call data
 * @param {object} leadData - Lead information from call
 * @param {string} userId - User ID (will be extracted from context)
 * @returns {Promise<object>} - Created lead data
 */
export async function createZohoLead(leadData, userId) {
  try {
    // Validate required fields
    if (!leadData.firstName || !leadData.phone) {
      throw new Error('First name and phone number are required');
    }

    // Prepare lead data for Zoho
    const zohoLeadData = {
      firstName: leadData.firstName,
      lastName: leadData.lastName || '',
      email: leadData.email || '',
      phone: leadData.phone,
      company: leadData.company || '',
      description: leadData.description || 'Lead created from voice call'
    };

    // Create lead in Zoho CRM
    const lead = await zohoService.createLead(userId, zohoLeadData);

    return {
      success: true,
      message: `Lead ${leadData.firstName} created successfully in Zoho CRM`,
      leadId: lead.id,
      leadName: `${leadData.firstName} ${leadData.lastName || ''}`.trim(),
      company: leadData.company || 'Not specified'
    };

  } catch (error) {
    console.error('Error creating Zoho lead:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create a deal/opportunity in Zoho CRM from voice call data
 * @param {object} dealData - Deal information from call
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Created deal data
 */
export async function createZohoDeal(dealData, userId) {
  try {
    // Validate required fields
    if (!dealData.name || !dealData.contactName) {
      throw new Error('Deal name and contact name are required');
    }

    // Prepare deal data for Zoho
    const zohoDealData = {
      name: dealData.name,
      accountName: dealData.accountName || '',
      contactName: dealData.contactName,
      amount: dealData.amount || 0,
      stage: dealData.stage || 'Qualification',
      description: dealData.description || 'Deal created from voice call'
    };

    // Create deal in Zoho CRM
    const deal = await zohoService.createDeal(userId, zohoDealData);

    return {
      success: true,
      message: `Deal "${dealData.name}" created successfully in Zoho CRM`,
      dealId: deal.id,
      dealName: dealData.name,
      amount: dealData.amount || 0,
      stage: dealData.stage || 'Qualification'
    };

  } catch (error) {
    console.error('Error creating Zoho deal:', error);
    return {
      success: false,
      error: error.message
    };
  }
} 