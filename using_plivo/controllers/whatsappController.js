import { sendWhatsAppMessage, sendWhatsAppTemplateMessage } from '../services/whatsappService.js';

export async function sendMessage(req, res) {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, message' });
  }
  try {
    const result = await sendWhatsAppMessage(to, message);
    res.status(200).json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
}

export async function sendTemplateMessage(req, res) {
  const { to, customer_name, date_and_time } = req.body;
  if (!to || !customer_name || !date_and_time) {
    return res.status(400).json({ error: 'Missing required fields: to, customer_name, date_and_time' });
  }

  // Build the components array for WhatsApp API
  const components = [
    {
      type: "body",
      parameters: [
        { type: "text", parameter_name: "customer_name", text: customer_name },
        { type: "text", parameter_name: "date_and_time", text: date_and_time }
      ]
    }
  ];

  try {
    const result = await sendWhatsAppTemplateMessage(
      to,
      "dental_appointment_confirmation", // templateName
      "en_US",                          // languageCode
      components
    );
    res.status(200).json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
} 