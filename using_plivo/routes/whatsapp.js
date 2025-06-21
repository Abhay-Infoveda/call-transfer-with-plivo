import express from "express";
import { sendMessage, sendTemplateMessage } from "../controllers/whatsappController.js";
// import { authenticate } from "../middlewares/authMiddleware.js"; // Uncomment if you want to protect the route

const router = express.Router();

// router.post('/send', authenticate, sendMessage); // Protected
router.post('/send', sendMessage); // Unprotected
router.post('/send-template', sendTemplateMessage); // Unprotected

export default router; 