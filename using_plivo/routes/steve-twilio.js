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

// Transfer destination mapping
const TRANSFER_DESTINATIONS = {
    sales: process.env.SALES_PHONE_NUMBER || process.env.DESTINATION_PHONE_NUMBER,
    support: process.env.SUPPORT_PHONE_NUMBER || process.env.DESTINATION_PHONE_NUMBER,
    supervisor: process.env.SUPERVISOR_PHONE_NUMBER || process.env.DESTINATION_PHONE_NUMBER,
    billing: process.env.BILLING_PHONE_NUMBER || process.env.DESTINATION_PHONE_NUMBER,
    general: process.env.DESTINATION_PHONE_NUMBER
};

async function transferActiveCall(callSid, transferType = 'general') {
    try {
        console.log(`[Transfer] Initiating transfer for call ${callSid} to ${transferType} team`);
    
        // Get call details
        const callData = activeCalls.get(callSid);
        if (!callData || !callData.twilioCallSid) {
            throw new Error('Call not found or invalid CallSid');
        }
        
        const twilio_call_sid = callData.twilioCallSid;
        const call = await client.calls(twilio_call_sid).fetch();
        const conferenceName = `transfer_${twilio_call_sid}_${transferType}`;
        const callerNumber = call.to;

        // Get destination number based on transfer type
        const destinationNumber = TRANSFER_DESTINATIONS[transferType] || TRANSFER_DESTINATIONS.general;
        
        if (!destinationNumber) {
            throw new Error(`No destination number configured for transfer type: ${transferType}`);
        }

        console.log(`[Transfer] Routing to ${transferType} team at ${destinationNumber}`);

        // Move caller to a conference room
        const customerTwiml = new twilio.twiml.VoiceResponse();
        customerTwiml.say(`Please hold while we connect you to our ${transferType} team.`);
        customerTwiml.dial().conference({
            startConferenceOnEnter: false,
            endConferenceOnExit: false,
            waitUrl: "http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical",
        }, conferenceName);

        console.log(`[Transfer] Updating call ${twilio_call_sid} with conference TwiML`);
        await client.calls(twilio_call_sid).update({ twiml: customerTwiml.toString() });

        console.log(`[Transfer] Caller ${callerNumber} placed in conference ${conferenceName}`);

        // Call the agent and connect them to the same conference
        const agentCall = await client.calls.create({
            to: destinationNumber,
            from: +17654417424,
            twiml: `
                <Response>
                <Say>You are being connected to a caller who was speaking with our AI assistant. They requested to speak with the ${transferType} team.</Say>
                <Dial>
                    <Conference startConferenceOnEnter="true" endConferenceOnExit="true" beep="false">
                    ${conferenceName}
                    </Conference>
                </Dial>
                </Response>
            `
        });

        console.log(`[Transfer] Outbound call to ${transferType} team created: ${agentCall.sid}`);

        activeCalls.set(callSid, {
            status: "transferring",
            conferenceName,
            agentCallSid: agentCall.sid,
            destinationNumber,
            transferType
        });

        return { 
            success: true, 
            agentCallSid: agentCall.sid,
            transferType,
            destinationNumber
        };
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
        
        ---

        After all booking details are collected and confirmed, finalize the reservation using the **Create\_Event** tool and **Save\_Booking\_Details** tool to save the booking details in the database and send a confirmation email using the **Send\_Email** tool.

        Before ending the call, ask if the guest needs any further assistance.

        Always allow the guest to finish speaking—**do not interrupt**. If the conversation goes off-topic, gently guide it back to the booking. If the guest asks to speak with a human agent, **transfer the call**, and then **end the call once the handover is complete**.
        If at any point the guest speaks rudely, uses harsh language, or sounds frustrated, stay calm, polite, and professional — do not mirror their tone or argue. Acknowledge their frustration with phrases like “I understand this may be frustrating, and I’m here to help” or “Let’s work together to get this sorted for you.” If the rudeness continues, politely remind the guest, “I’m here to assist you — let’s please keep this respectful so I can help you better.” If the guest becomes abusive or uncooperative despite reminders, say “It seems we’re unable to continue this conversation productively. I will now end the call, but you’re welcome to reach out again when ready,” and end the call. If the guest requests to speak with a human agent at any point, transfer the call and end the call after the handover is complete.`;
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

         res.type('text/xml').send(twiml.toString());

        // --- Step 2: Start the recording via REST API ---
        console.log(`Starting recording for call: ${twilioCallSid}`);
        await client.calls(twilioCallSid).recordings.create({
            recordingChannels: 'dual' // Use 'mono' if you want a single channel
        });
        console.log(`Recording started for call: ${twilioCallSid}`);

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
    const { callId, transferType } = req.body;
    console.log(`Request to transfer call with callId: ${callId} and transferType: ${transferType}`);

    try {
        const result = await transferActiveCall(callId, transferType);
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
