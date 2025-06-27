import express from 'express';
import { getCallTranscript } from '../utils/ultravox-utils.js';
import { saveTranscript } from '../tools/googleSheets/Save_transcript.js';

const router = express.Router();

router.post('/webhook', async (req, res) => {
  console.log('Incoming Ultravox Webhook!', req.body);

  try {
    const data = req.body;

    if (data.event === "call.ended") {
      const callId = data.call.callId;
      // Get transcript from Ultravox
      const transcriptMsgs = await getCallTranscript(callId);
      // Format transcript as a string
      const transcript = transcriptMsgs.map(msg => `${msg.role}: ${msg.text}`).join('\n\n');
      // Save transcript to Google Sheets as an array
      await saveTranscript([
        new Date().toISOString(),
        callId,
        transcript
      ]);
      console.log(`Transcript saved for call: ${callId}`);
    }
    res.status(204).json({ received: true });
  } catch (error) {
    console.error('Error processing Ultravox webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

export default router; 