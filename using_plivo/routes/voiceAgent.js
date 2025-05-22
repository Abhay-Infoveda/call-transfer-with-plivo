import express from 'express';
import { getVoiceAgentUrl } from '../controllers/voiceAgentController.js';
import verifyToken from '../middlewares/authMiddleware.js'

const router = express.Router();

router.get('/url', verifyToken, getVoiceAgentUrl);

export default router;
