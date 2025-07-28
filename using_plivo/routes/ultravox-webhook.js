import express from 'express';
import { getCallTranscript } from '../utils/ultravox-utils.js';
import { saveTranscript } from '../tools/googleSheets/Save_transcript.js';
import { get_summary } from '../utils/ultravox-utils.js';
import { getPhoneNumberByCallId } from '../utils/callMapping.js';
import { getCalleeEmailByPhoneNumber } from '../utils/calleeLookup.js';
import { summarizeTranscript } from '../utils/summarizeWithOpenAI.js';
import { sendGmail } from '../tools/gmail/sendGmail.js';

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

      // --- New: Send summary email to callee ---
      if (phoneNumber) {
        const calleeEmail = getCalleeEmailByPhoneNumber(phoneNumber);
        if (calleeEmail) {
          try {
            const aiSummary = await summarizeTranscript(transcript);
            const subject = 'Summary of Your Recent Call';
            const text = `Dear Customer,\n\nHere is a brief summary of your recent call:\n\n${aiSummary}\n\nThank you for your time.\n\nBest regards,\nTrial Bank AI Agent`;
            await sendGmail('abhay.pancholi@infovedasolutions.com', calleeEmail, subject, text);
            console.log(`Summary email sent to ${calleeEmail}`);
          } catch (err) {
            console.error('Error sending summary email:', err);
          }
        } else {
          console.warn(`No email found for phone number: ${phoneNumber}`);
        }
      }
    }
    // res.sendStatus(204);
  } catch (error) {
    console.error('Error processing Ultravox webhook:', error);
    res.sendStatus(500);
  }
});

export default router; 