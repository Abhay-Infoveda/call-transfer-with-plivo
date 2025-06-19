import express from 'express';
import { appendToSheet } from '../tools/googleSheets/googleSheetTool.js';

const router = express.Router();

router.post('/append', async (req, res) => {
  const { userEmail, spreadsheetId, sheetName, values } = req.body;

  if (!userEmail || !spreadsheetId || !sheetName || !values) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await appendToSheet(userEmail, spreadsheetId, sheetName, values);
    res.status(200).json({ message: 'Row appended successfully', result });
  } catch (error) {
    console.error('Append failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
