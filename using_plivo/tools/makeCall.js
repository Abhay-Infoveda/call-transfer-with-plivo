import dotenv from 'dotenv';
dotenv.config();

import { makeOutboundCall } from '../utils/outboundCall.js';
import { ULTRAVOX_CALL_CONFIG as ANIKA_CONFIG } from '../config/ultravox-config-anika.js';

const phoneNumber = process.env.TEST_PHONE_NUMBER || '+918459247685';
const config = { ...ANIKA_CONFIG };

makeOutboundCall(phoneNumber, config)
  .then(sid => console.log('Call SID:', sid))
  .catch(err => console.error('Error making call:', err)); 