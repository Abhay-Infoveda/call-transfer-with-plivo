import axios from 'axios';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL; // e.g., 'https://graph.facebook.com/v18.0/<phone-number-id>/messages'
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; // Permanent or temporary access token
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID; // Your WhatsApp Business phone number ID

export async function sendWhatsAppMessage(to, message) {
  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

export async function sendWhatsAppTemplateMessage(to, templateName, languageCode, components = []) {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components.length > 0 ? { components } : {})
      }
    };
    console.log('WhatsApp API Payload:', JSON.stringify(payload, null, 2));
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      payload,
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
} 