// routes/emailTool.js
import express from 'express';
import { sendEmail } from '../tools/emailsender.js';

//Expected json from ultravox:
/*{
    "userEmail": "user@gmail.com",
    "to": "receiver@example.com",
    "subject": "Appointment Confirmation",
    "text": "Your appointment is confirmed for tomorrow at 4 PM."
  }*/
  

const router = express.Router();

router.post('/send', async (req, res) => {
  const { userEmail, to, subject, text } = req.body;

  if (!userEmail || !to || !subject || !text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await sendEmail(userEmail, to, subject, text);
    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;