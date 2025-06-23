import express from 'express';
import twilio from 'twilio';
import 'dotenv/config';
import { createUltravoxCall } from '../utils/ultravox-utils.js';
import { ULTRAVOX_CALL_CONFIG } from '../config/ultravox-config-steve.js';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const destinationNumber = process.env.DESTINATION_PHONE_NUMBER;
const router = express.Router();

// Hack: Dictionary to store Twilio CallSid and Ultravox Call ID mapping
// TODO replace this with something more durable
const activeCalls = new Map();

async function transferActiveCall(callSid) {
    try {
        //   console.log(`[Transfer] Initiating transfer for call ${callSid} to ${agentNumber}`);
    
        // Get call details
        const callData = activeCalls.get(callSid);
        if (!callData || !callData.twilioCallSid) {
        throw new Error('Call not found or invalid CallSid');
        }
        const twilio_call_sid = callData.twilioCallSid;
        const call = await client.calls(twilio_call_sid).fetch();
        const conferenceName = `transfer_${twilio_call_sid}`;
        const callerNumber = call.to;

        // Move caller to a conference room
        const customerTwiml = new twilio.twiml.VoiceResponse();
        customerTwiml.say("Please hold while we connect you to an agent.");
        customerTwiml.dial().conference({
        startConferenceOnEnter: false,
        endConferenceOnExit: false,
        waitUrl: "http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical",
        }, conferenceName);

        console.log(`[Transfer] Updating call ${twilio_call_sid} with conference TwiML`);
        await client.calls(twilio_call_sid).update({ twiml: customerTwiml.toString() });

        console.log(`[Transfer] Caller ${callerNumber} placed in conference ${conferenceName}`);

        // Call the agent and connect them to the same conference
        //   console.log(`[Transfer] Creating outbound call to agent ${agentNumber}`);
        const agentCall = await client.calls.create({
        to: destinationNumber,
        from: +17654417424,
        twiml: `
            <Response>
            <Say>You are being connected to a caller who was speaking with our AI assistant.</Say>
            <Dial>
                <Conference startConferenceOnEnter="true" endConferenceOnExit="true" beep="false">
                ${conferenceName}
                </Conference>
            </Dial>
            </Response>
        `
        });

        console.log(`[Transfer] Outbound call to agent created: ${agentCall.sid}`);

        activeCalls.set(callSid, {
        status: "transferring",
        conferenceName,
        agentCallSid: agentCall.sid,
        destinationNumber,
        });

        return { success: true, agentCallSid: agentCall.sid };
    } catch (error) {
        console.error("[Transfer] Error transferring call:", error);
        console.error("[Transfer] Full error details:", error.stack);
        return { success: false, error: error.message };
    }
}

// Handle incoming calls from Twilio
router.post('/incoming/steve', async (req, res) => {
    try {
        console.log('Incoming call received');
        const twilioCallSid = req.body.CallSid;
        console.log('Twilio CallSid:', req.body);
        const callerNumber = req.body.From
        const ultravoxConfig = JSON.parse(JSON.stringify(ULTRAVOX_CALL_CONFIG));
        console.log('Ultravox call config JSON:', ultravoxConfig.systemPrompt)
        ultravoxConfig.systemPrompt = `${ultravoxConfig.systemPrompt}. 
        ### **WhatsApp Notification Instructions**
        * The caller’s phone number is: **${callerNumber}**
        * Ask the guest if **${callerNumber}** is their **WhatsApp number** where the booking confirmation can be sent.
        * If it is not, politely ask for their **10-digit mobile number** that is active on WhatsApp.
        * Make sure the number has **exactly 10 digits** (making it a **12-digit number** with the country code, like '+91XXXXXXXXXX').
        * If the number is not 10 digits, **politely ask the guest to recheck and provide the correct mobile number**.
        * Once collected, **repeat the number slowly, digit by digit**, and **ask the guest to confirm it is correct** before continuing.

        ---

        After all booking details are collected and confirmed, finalize the reservation using the **Create\_Event** tool and **Save\_Booking\_Details** tool to save the booking details in the database and send a confirmation email using the **Send\_Email** tool.

        Before ending the call, ask if the guest needs any further assistance.

        Always allow the guest to finish speaking—**do not interrupt**. If the conversation goes off-topic, gently guide it back to the booking. If the guest asks to speak with a human agent, **transfer the call**, and then **end the call once the handover is complete**.
        `;
        // Create the Ultravox call
        const response = await createUltravoxCall(ultravoxConfig);

        activeCalls.set(response.callId, {
            twilioCallSid: twilioCallSid
        });

        const twiml = new twilio.twiml.VoiceResponse();
        const connect = twiml.connect();
        connect.stream({
            url: response.joinUrl,
            name: 'ultravox'
        });

        const twimlString = twiml.toString();
        res.type('text/xml');
        res.send(twimlString);

    } catch (error) {
        console.error('Error handling incoming call:', error);
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say('Sorry, there was an error connecting your call.');
        res.type('text/xml');
        res.send(twiml.toString());
    }
});

// Handle transfer of calls to another number
router.post('/transferCall', async (req, res) => {
    const { callId } = req.body;
    console.log(`Request to transfer call with callId: ${callId}`);

    try {
        const result = await transferActiveCall(callId);
        res.json(result);
    } catch (error) {
        res.status(500).json(error);
    }
});

router.get('/active-calls', (req, res) => {
    const calls = Array.from(activeCalls.entries()).map(([ultravoxCallId, data]) => ({
        ultravoxCallId,
        ...data
    }));
    res.json(calls);
});

export { router };
