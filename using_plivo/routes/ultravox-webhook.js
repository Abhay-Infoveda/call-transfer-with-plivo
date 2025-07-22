import express from 'express';
import { getCallTranscript } from '../utils/ultravox-utils.js';
import { saveTranscript } from '../tools/googleSheets/Save_transcript.js';
import { get_summary } from '../utils/ultravox-utils.js';
import { getPhoneNumberByCallId } from '../utils/callMapping.js';

const router = express.Router();

router.post('/webhook', async (req, res) => {
  console.log('Incoming Ultravox Webhook!', req.body);

  try {
    const data = req.body;

    if (data.event === "call.ended") {
      res.sendStatus(204);
      const callId = data.call.callId;
      // Get transcript from Ultravox
      const transcriptMsgs = await getCallTranscript(callId);
      // Format transcript as a string
      const transcript = transcriptMsgs.map(msg => `${msg.role}: ${msg.text}`).join('\n\n');
      // Save transcript to Google Sheets as an array
      const { shortSummary, summary } = await get_summary(callId);
      const phoneNumber = await getPhoneNumberByCallId(callId);
      await saveTranscript([
        new Date().toISOString(),
        callId,
        transcript,
        shortSummary,
        summary,
        data.call.endReason,
        phoneNumber || '',
      ]);
      console.log(`Transcript saved for call: ${callId}`);
    }
    // res.sendStatus(204);
  } catch (error) {
    console.error('Error processing Ultravox webhook:', error);
    res.sendStatus(500);
  }
});

export default router; 