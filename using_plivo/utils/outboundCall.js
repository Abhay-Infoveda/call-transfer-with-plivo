import twilio from 'twilio';
import { createUltravoxCall } from './ultravox-utils.js';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Make an outbound call using Ultravox and Twilio
 * @param {string} phoneNumber - The phone number to call (in E.164 format)
 * @param {object} config - The Ultravox call config (should include systemPrompt, etc.)
 * @returns {Promise<{ callId: string, sid: string }>} - The Ultravox callId and Twilio call SID
 */
export async function makeOutboundCall(phoneNumber, config) {
  // 1. Create Ultravox call
  const { joinUrl, callId } = await createUltravoxCall(config);

  // 2. Make phone call with Twilio
  const call = await client.calls.create({
    twiml: `<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Connect><Stream url=\"${joinUrl}\"/></Connect></Response>`,
    to: phoneNumber,
    from: process.env.TWILIO_PHONE_NUMBER,
    record: true
  });

  return { callId, sid: call.sid };
} 