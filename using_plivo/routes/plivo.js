// routes/plivo.js
import express from 'express';
import plivo from 'plivo';
import NodeCache from 'node-cache';
import { createUltravoxCall } from '../ultravox-utils.js';
import { ULTRAVOX_CALL_CONFIG } from '../ultravox-config.js';

const router = express.Router();

// Environment variables
const authId = process.env.PLIVO_AUTH_ID;
const authToken = process.env.PLIVO_AUTH_TOKEN;
const destinationNumber = process.env.DESTINATION_PHONE_NUMBER;
const fromNumber = process.env.PLIVO_PHONE_NUMBER;
const baseUrl = process.env.BASE_URL;

// Create Plivo client
const plivoClient = new plivo.Client(authId, authToken);

// In-memory TTL cache for active calls (1 hour TTL)
const activeCalls = new NodeCache({ stdTTL: 3600 });

router.post('/incoming', async (req, res) => {
  try {
    console.log('Incoming call received');
    const plivoCallUUID = req.body.CallUUID;
    const callerPhone = req.body.From;
    console.log('Plivo CallUUID:', plivoCallUUID);

    const response = await createUltravoxCall(ULTRAVOX_CALL_CONFIG);

    activeCalls.set(response.callId, {
      ultravoxCallId: response.callId,
      plivoCallUUID,
      callerPhone,
      createdAt: Date.now(),
      streamId: null,
      aiMemberId: null,
      state: 'awaiting_transfer'
    });

    const plivoResponse = new plivo.Response();

    plivoResponse.addStream(response.joinUrl, {
      streamTimeout: "86400",
      keepCallAlive: "true",
      bidirectional: "true",
      contentType: "audio/x-mulaw;rate=8000",
      statusCallbackUrl: `${baseUrl}/plivo/stream-events`,
      statusCallbackMethod: "POST"
    });

    const mpc = plivoResponse.addMultiPartyCall("UltravoxMPC", {
      role: 'Customer',
      maxDuration: 3600,
      record: false,
      coachMode: false,
      enterSound: 'none',
      startMpcOnEnter: true,
      statusCallbackUrl: `${baseUrl}/plivo/mpc-events`,
      statusCallbackMethod: "POST",
      statusCallbackEvents: "mpc-state-changes,participant-state-changes"
    });

    if (mpc) mpc.addText("UltravoxMPC");

    console.log('Responding with XML:', plivoResponse.toXML());
    res.set('Content-Type', 'text/xml');
    res.send(plivoResponse.toXML());
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

router.get('/active-calls', (req, res) => {
  const keys = activeCalls.keys();
  const calls = keys.map(callId => ({
    callId,
    ...activeCalls.get(callId)
  }));
  res.json(calls);
});

// Function to transfer active call to human agent
async function transferActiveCall(ultravoxCallId) {
  try{
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

  callData.state = 'transferring';
  activeCalls.set(ultravoxCallId, callData);

  const outboundCall = await plivoClient.calls.create(
    fromNumber,
    destinationNumber,
    `${baseUrl}/plivo/transfer-xml`,
    { callbackUrl: `${baseUrl}/plivo/callback` }
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
      role: "Agent",
      maxDuration: 3600,
      coachMode: false,
      enterSound: "none",
      startMpcOnEnter: true,
      statusCallbackUrl: `${baseUrl}/plivo/mpc-events`,
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
  console.log('MPC event:', req.body);

  if (req.body.EventName === 'MPCEnd') {
    const keys = activeCalls.keys();
    keys.forEach(callId => {
      const data = activeCalls.get(callId);
      if (data && data.plivoCallUUID === req.body.ParticipantCallUUID) {
        activeCalls.del(callId);
        console.log(`Cleaned up session for callId: ${callId}`);
      }
    });
  }

  res.status(200).end();
});

router.post('/callback', (req, res) => {
  console.log('Callback received:', req.body);
  res.status(200).end();
});

router.post('/stream-events', (req, res) => {
  console.log('Stream event:', req.body);

  const { CallUUID, Event, StreamID } = req.body;

  if (Event === 'StartStream') {
    const keys = activeCalls.keys();
    keys.forEach(callId => {
      const data = activeCalls.get(callId);
      if (data && data.plivoCallUUID === CallUUID) {
        data.streamId = StreamID;
        activeCalls.set(callId, data);
        console.log(`Mapped streamId ${StreamID} to callId ${callId}`);
      }
    });
  }

  res.status(200).end();
});

export { router };
