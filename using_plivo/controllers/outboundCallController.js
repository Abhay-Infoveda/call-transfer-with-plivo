import { makeOutboundCall } from '../utils/outboundCall.js';
import { ULTRAVOX_CALL_CONFIG as ANIKA_CONFIG } from '../config/ultravox-config-anika.js';
import { ULTRAVOX_CALL_CONFIG as STEVE_CONFIG } from '../config/ultravox-config-steve.js';

export async function makeOutboundCallApi(req, res) {
  try {
    const { phoneNumber, agent } = req.body;
    if (!phoneNumber || !agent) {
      return res.status(400).json({ error: 'phoneNumber and agent are required' });
    }

    let config;
    if (agent === 'anika') {
      config = { ...ANIKA_CONFIG };
    } else if (agent === 'steve') {
      config = { ...STEVE_CONFIG };
    } else {
      return res.status(400).json({ error: 'Invalid agent. Use "anika" or "steve".' });
    }

    const sid = await makeOutboundCall(phoneNumber, config);
    return res.json({ sid });
  } catch (err) {
    console.error('Error in outbound call API:', err);
    return res.status(500).json({ error: err.message });
  }
} 