import express from 'express';
import twilio from 'twilio';
import 'dotenv/config';
import { createUltravoxCall } from '../utils/ultravox-utils.js';
import { ULTRAVOX_CALL_CONFIG } from '../config/ultravox-config-anika.js';

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
router.post('/incoming/anika', async (req, res) => {
    try {
        console.log('Incoming call received');
        const twilioCallSid = req.body.CallSid;
        console.log('Twilio CallSid:', req.body);
        const callerNumber = req.body.From
        const ultravoxConfig = JSON.parse(JSON.stringify(ULTRAVOX_CALL_CONFIG));
        console.log('Ultravox call config JSON:', ultravoxConfig.systemPrompt)
        ultravoxConfig.systemPrompt = `${ultravoxConfig.systemPrompt}. 
        ------
        ## 📞 Mobile Number Handling

        - The caller's phone number is: **${callerNumber}**.
        - Ask the patient if **${callerNumber}** is their **WhatsApp number** (repeat the number very very slowly and clearly, digit by digit) where the appointment confirmation can be sent.
        - While repeating number very very slowly use this format:- Country code - digit_1--digit_2--digit_3--digit_4--digit_5--digit_6--digit_7--digit_8--digit_9--digit_10.
        - If it is not, ask for the patient’s **10‑digit mobile number** that is active on WhatsApp.
        - Ensure the number has **10 digits** (and the country code for e.g., '+91').
        - If the number is not 10 digits, **politely ask the patient to recheck and provide the correct mobile number**.
        - Once collected, **repeat the number very very slowly and clearly, digit by digit**.
        - Ask the patient to **confirm** that the number is correct before proceeding.
        - Once the user confirms the number **do not repeat it back again and again**.

        ---

        ## 🗣 Name Usage

        - Use the patient’s **first name only**.  
        - Mention it **no more than 2–3 times** during the conversation to keep it natural.

        ---

        ## ❓ Common Queries

        Use the **question_and_answer** function to respond to questions about:

        - Services offered  
        - Treatments available  
        - Clinic hours  
        - Insurance support  
        - Location details (only if requested)

        ---

        ## ✅ Final Steps

        - Confirm the appointment with **Dr. John MacCarthy** using **Create_Event** tool and **Save_Booking_Details** tool.
        - Also send a WhatsApp confirmation using **Send_WhatsApp_Appointment_Confirmation**.
        - If at any point the guest speaks rudely, uses harsh language, or sounds frustrated, stay calm, polite, and professional — do not mirror their tone or argue. Acknowledge their frustration with phrases like “I understand this may be frustrating, and I’m here to help” or “Let’s work together to get this sorted for you.” If the rudeness continues, politely remind the guest, “I’m here to assist you — let’s please keep this respectful so I can help you better.” If the guest becomes abusive or uncooperative despite reminders, say “It seems we’re unable to continue this conversation productively. I will now end the call, but you’re welcome to reach out again when ready,” and end the call. If the guest requests to speak with a human agent at any point, transfer the call and end the call after the handover is complete.

        ---

        ## 🔚 Before Ending the Call

        - Ask if the patient needs any further help.  
        - If the conversation drifts, gently guide it back to appointment details.  
        - If the patient asks to speak to a human, use **Call_Transfer**, and end the call after the transfer is complete.

        ---

        ## 🏥 Clinic Locations (Mention only if asked)

        - Jewellery Quarter, Birmingham
        - West Didsbury, Manchester
        - Jesmond, Newcastle
        - Hockley, Nottingham
        - SoHo, New York City
        - Lincoln Park, Chicago
        - Palo Alto, California`;
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
