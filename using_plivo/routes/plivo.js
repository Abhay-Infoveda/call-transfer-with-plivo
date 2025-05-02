// routes/plivo.js
import express from 'express';
import plivo from 'plivo';
import { createUltravoxCall } from '../ultravox-utils.js';
import { ULTRAVOX_CALL_CONFIG } from '../ultravox-config.js';

const router = express.Router();

// Environment variables
const authId = process.env.PLIVO_AUTH_ID;
const authToken = process.env.PLIVO_AUTH_TOKEN;
const destinationNumber = process.env.DESTINATION_PHONE_NUMBER;
const fromNumber = process.env.PLIVO_PHONE_NUMBER;

// Create Plivo client
const plivoClient = new plivo.Client(authId, authToken);

// Dictionary to store Plivo CallUUID and Ultravox Call ID mapping
const activeCalls = new Map();

// In routes/plivo.js, update the incoming call handler:

router.post('/incoming', async (req, res) => {
    try {
      console.log('Incoming call received');
      const plivoCallUUID = req.body.CallUUID;
      console.log('Plivo CallUUID:', plivoCallUUID);
      
      // Create the Ultravox call
      try {
        const response = await createUltravoxCall(ULTRAVOX_CALL_CONFIG);
        
        // Store the association between Plivo call and Ultravox call
        activeCalls.set(response.callId, {
          plivoCallUUID: plivoCallUUID
        });
        
        // Create the XML for Plivo to handle the call
        const plivoResponse = new plivo.Response();
        
        // Using MultiPartyCall to help with the transfer later
        const stream = plivoResponse.addStream(response.joinUrl,{
          streamTimeout: "86400",
          keepCallAlive: "true",
          bidirectional: "true",
          contentType: "audio/x-mulaw;rate=8000",
          statusCallbackUrl: `${process.env.BASE_URL}/plivo/stream-events`,
          statusCallbackMethod: "POST"
        });
        
        // Add the MPC element to keep the call alive for transfer
        const mpc = plivoResponse.addMultiPartyCall("UltravoxMPC",{
            role: 'Customer',
            maxDuration: 3600,
            record: false,
            coachMode: false,
            enterSound: 'none',
            startMpcOnEnter: true,
            statusCallbackUrl: `${process.env.BASE_URL}/plivo/mpc-events`,
            statusCallbackMethod: "POST",
            statusCallbackEvents: "mpc-state-changes,participant-state-changes"
        });
        
        if (mpc) {
            mpc.addText("UltravoxMPC");
        } else {
            console.error('Failed to create MultiPartyCall element');
        }
              
        console.log('Responding with XML:', plivoResponse.toXML());
        res.set('Content-Type', 'text/xml');
        res.send(plivoResponse.toXML());
      } catch (ultravoxError) {
        console.error('Ultravox API error:', ultravoxError);
        
        // Provide a friendly response to the caller
        const plivoResponse = new plivo.Response();
        plivoResponse.addSpeak('Sorry, our virtual assistant is currently unavailable. Please try again later.');
        
        res.set('Content-Type', 'text/xml');
        res.send(plivoResponse.toXML());
      }
    } catch (error) {
      console.error('Error handling incoming call:', error);
      
      const plivoResponse = new plivo.Response();
      plivoResponse.addSpeak('Sorry, there was an error connecting your call.');
      
      res.set('Content-Type', 'text/xml');
      res.send(plivoResponse.toXML());
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

// API endpoint to list active calls
router.get('/active-calls', (req, res) => {
  const calls = Array.from(activeCalls.entries()).map(([ultravoxCallId, data]) => ({
    ultravoxCallId,
    ...data
  }));
  res.json(calls);
});

// Function to transfer active call to human agent
async function transferActiveCall(ultravoxCallId) {
  try {
    const callData = activeCalls.get(ultravoxCallId);
    if (!callData || !callData.plivoCallUUID) {
      throw new Error('Call not found or invalid CallUUID');
    }

    const customerLegUuid = callData.plivoCallUUID;

    if (callData.streamId) {
      try {
        await plivoClient.calls.stopStream(customerLegUuid, callData.streamId);
        console.log('AI audio stream stopped');
      } catch (e) {
        console.warn('Error stopping AI stream:', e.message);
      }
    } else {
      console.warn('No streamId found for this call');
    }
  // 2) Kick AI participant from MPC
  if (callData.aiMemberId) {
    await plivoClient.multiPartyCalls.kickParticipant(
      'name_UltravoxMPC', 
      callData.aiMemberId
    );
    console.log('AI participant removed from MPC');}
    
    // Make an outbound call to the agent
    const outboundCall = await plivoClient.calls.create(
      fromNumber,               // From number (your Plivo number)
      destinationNumber,        // To number (human agent)
      `${process.env.BASE_URL}/plivo/transfer-xml`, // Answer URL with XML for agent side
      {
        callbackUrl: `${process.env.BASE_URL}/plivo/callback`
      }
    );
    
    return {
      status: 'success',
      message: 'Call transfer initiated',
      callDetails: outboundCall
    };
  } catch (error) {
    console.error('Error transferring call:', error);
    throw {
      status: 'error',
      message: 'Failed to transfer call',
      error: error.message
    };
  }
}

// XML for the agent leg of the call
router.post('/transfer-xml', (req, res) => {
  try {
    const plivoResponse = new plivo.Response();
    const mpcAgent = plivoResponse.addMultiPartyCall("UltravoxMPC", {
      role:            "Agent",
      maxDuration:     3600,
      coachMode:       false,
      enterSound:      "none",
      startMpcOnEnter: true,
      statusCallbackUrl: `${process.env.BASE_URL}/plivo/mpc-events`,
      statusCallbackMethod: "POST",
      statusCallbackEvents: "mpc-state-changes,participant-state-changes"
    });
    mpcAgent.addText("UltravoxMPC");
    res.set('Content-Type', 'text/xml');
    res.send(plivoResponse.toXML());
  } catch (err) {
    console.error('Error in /transfer-xml:', err);
    res.set('Content-Type', 'text/xml');
    res.status(200).send('<Response><Speak>Transfer setup failed</Speak></Response>');
  }
});


router.post('/mpc-events', (req, res) => {
  if (req.body.Event === 'participant-state-changes' && req.body.State === 'joined') {
    const { mpcName, memberId, callId } = req.body;  
    // store memberId for later kick
    const entry = activeCalls.get(callId);
    entry.aiMemberId = memberId;
    activeCalls.set(callId, entry);
  }

  console.log('MPC event:', req.body);
  res.status(200).end();
});

// Callback handler for the outbound call status updates
router.post('/callback', (req, res) => {
  console.log('Callback received:', req.body);
  res.status(200).end();
});

router.post('/stream-events', (req, res) => {
  console.log('Stream event:', req.body);

  const { CallUUID, Event, StreamID } = req.body;

  if (Event === 'StartStream') {
    // Find the right Ultravox callId entry
    for (const [ultravoxCallId, data] of activeCalls.entries()) {
      if (data.plivoCallUUID === CallUUID) {
        data.streamId = StreamID;
        activeCalls.set(ultravoxCallId, data);
        console.log(`Mapped streamId ${StreamID} to callId ${ultravoxCallId}`);
      }
    }
  }

  res.status(200).end();
});

export { router };