// routes/plivo.js
import express from 'express';
import plivo from 'plivo';
import redis from '../services/redisClient.js';
import { createUltravoxCall } from '../utils/ultravox-utils.js';
import { ULTRAVOX_CALL_CONFIG } from '../config/ultravox-config.js';

const router = express.Router();

const authId = process.env.PLIVO_AUTH_ID;
const authToken = process.env.PLIVO_AUTH_TOKEN;
const destinationNumber = process.env.DESTINATION_PHONE_NUMBER;
const fromNumber = process.env.PLIVO_PHONE_NUMBER;
const baseUrl = process.env.BASE_URL;

const plivoClient = new plivo.Client(authId, authToken);

router.post('/incoming', async (req, res) => {
  try {
    console.log('Incoming call received');
    const plivoCallUUID = req.body.CallUUID;
    const callerPhone = req.body.From;
    console.log('Plivo CallUUID:', plivoCallUUID);

    const response = await createUltravoxCall(ULTRAVOX_CALL_CONFIG);

    const sessionData = {
      ultravoxCallId: response.callId,
      plivoCallUUID,
      callerPhone,
      createdAt: Date.now(),
      streamId: null,
      aiMemberId: null,
      state: 'awaiting_transfer'
    };

    await redis.set(`call:${response.callId}`, JSON.stringify(sessionData), { EX: 3600 });
    await redis.zAdd('recent_calls', [{ score: sessionData.createdAt, value: response.callId }]);

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

router.get('/active-calls', async (req, res) => {
  const keys = await redis.keys('call:*');
  const calls = [];
  for (const key of keys) {
    const data = await redis.get(key);
    if (data) calls.push({ callId: key.replace('call:', ''), ...JSON.parse(data) });
  }
  res.json(calls);
});

router.get('/recent-calls', async (req, res) => {
  const now = Date.now();
  const fiveMinsAgo = now - 5 * 60 * 1000;
  const callIds = await redis.zRangeByScore('recent_calls', fiveMinsAgo, now);
  const recentCalls = [];

  for (const callId of callIds) {
    const data = await redis.get(`call:${callId}`);
    if (data) recentCalls.push({ callId, ...JSON.parse(data) });
  }
  res.json(recentCalls);
});

async function transferActiveCall(ultravoxCallId) {
  try{
  const data = await redis.get(`call:${ultravoxCallId}`);
  if (!data) throw new Error('Call not found or invalid CallUUID');
  const callData = JSON.parse(data);

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
  await redis.set(`call:${ultravoxCallId}`, JSON.stringify(callData), { EX: 3600 });

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

router.post('/mpc-events', async (req, res) => {
  console.log('MPC event:', req.body);

  if (req.body.EventName === 'MPCEnd') {
    const keys = await redis.keys('call:*');
    for (const key of keys) {
      const value = await redis.get(key);
      const data = JSON.parse(value);
      if (data && data.plivoCallUUID === req.body.ParticipantCallUUID) {
        await redis.del(key);
        await redis.zRem('recent_calls', data.ultravoxCallId);
        console.log(`Cleaned up Redis session for ${key}`);
      }
    }
  }

  res.status(200).end();
});

router.post('/callback', (req, res) => {
  console.log('Callback received:', req.body);
  res.status(200).end();
});

router.post('/stream-events', async (req, res) => {
  console.log('Stream event:', req.body);

  const { CallUUID, Event, StreamID } = req.body;

  if (Event === 'StartStream') {
    const keys = await redis.keys('call:*');
    for (const key of keys) {
      const data = await redis.get(key);
      const session = JSON.parse(data);
      if (session && session.plivoCallUUID === CallUUID) {
        session.streamId = StreamID;
        await redis.set(key, JSON.stringify(session), { EX: 3600 });
        console.log(`Mapped streamId ${StreamID} to callId ${key}`);
      }
    }
  }

  res.status(200).end();
});

export { router };
