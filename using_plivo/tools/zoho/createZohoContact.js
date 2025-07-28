import zohoService from '../../services/zohoService.js';

/**
 * Create a new contact in Zoho CRM from voice call data
 * @param {object} contactData - Contact information from call
 * @param {string} userId - User ID (will be extracted from context)
 * @returns {Promise<object>} - Created contact data
 */
export async function createZohoContact(contactData, userId) {
  try {
    // Validate required fields
    if (!contactData.firstName || !contactData.phone) {
      throw new Error('First name and phone number are required');
    }

    // Prepare contact data for Zoho
    const zohoContactData = {
      firstName: contactData.firstName,
      lastName: contactData.lastName || '',
      email: contactData.email || '',
      phone: contactData.phone,
      description: contactData.description || 'Contact created from voice call'
    };

    // Create contact in Zoho CRM
    const contact = await zohoService.createContact(userId, zohoContactData);

    return {
      success: true,
      message: `Contact ${contactData.firstName} created successfully in Zoho CRM`,
      contactId: contact.id,
      contactName: `${contactData.firstName} ${contactData.lastName || ''}`.trim()
    };

  } catch (error) {
    console.error('Error creating Zoho contact:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Search for existing contacts in Zoho CRM
 * @param {string} searchTerm - Search term (email or phone)
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Search results
 */
export async function searchZohoContacts(searchTerm, userId) {
  try {
    if (!searchTerm) {
      throw new Error('Search term is required');
    }

    const contacts = await zohoService.searchContacts(userId, searchTerm);

    return {
      success: true,
      found: contacts.length > 0,
      contacts: contacts,
      message: contacts.length > 0 
        ? `Found ${contacts.length} contact(s) in Zoho CRM`
        : 'No contacts found in Zoho CRM'
    };

  } catch (error) {
    console.error('Error searching Zoho contacts:', error);
    return {
      success: false,
      error: error.message
    };
  }
} 