import express from 'express';
import { appendToSheet } from '../tools/googleSheets/googleSheetTool.js';
import { saveTranscript } from '../tools/googleSheets/Save_transcript.js';

const router = express.Router();

router.post('/append', async (req, res) => {
  const { phone_number, restaurant, guests, time, date, name } = req.body;

  // Validate required fields
  if (!phone_number || !restaurant || !guests || !time || !date || !name) {
    return res.status(400).json({ 
      error: 'Missing required fields. Please provide: phone_number, restaurant, guests, time, date, name'
    });
  }

  try {
    const bookingData = { phone_number, restaurant, guests, time, date, name };
    const result = await appendToSheet(bookingData);
    res.status(200).json({ 
      message: 'Booking details saved successfully', 
      result 
    });
  } catch (error) {
    console.error('Failed to save booking:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/append-cust-data', async (req, res) => {
  const { phone_number, name, payment_overdue_reason, due_pay_date } = req.body;

  // Validate required fields
  if (!phone_number || !name || !payment_overdue_reason || !due_pay_date) {
    return res.status(400).json({ 
      error: 'Missing required fields. Please provide: phone_number, restaurant, guests, time, date, name'
    });
  }

  try {
    const bookingData = { phone_number, name, payment_overdue_reason, due_pay_date};
    const result = await appendToSheet(bookingData);
    res.status(200).json({ 
      message: 'Booking details saved successfully', 
      result 
    });
  } catch (error) {
    console.error('Failed to save booking:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/save-transcript', async (req, res) => {
  const { callid } = req.body;
  if (!callid) {
    return res.status(400).json({ error: 'Missing required field: callid' });
  }
  try {
    const result = await saveTranscript(callid);
    res.status(200).json({ message: 'Transcript saved successfully', result });
  } catch (error) {
    console.error('Failed to save transcript:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
