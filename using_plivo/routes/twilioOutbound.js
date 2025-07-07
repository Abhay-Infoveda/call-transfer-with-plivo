import express from 'express';
import { makeOutboundCallApi } from '../controllers/outboundCallController.js';

const router = express.Router();

router.post('/api/outbound-call', makeOutboundCallApi);

export { router }; 