import express from 'express';
import { body } from 'express-validator';
import verifyToken from '../middlewares/authMiddleware.js';
import { 
  sendEmail, 
  getEmailStatus, 
  disconnectGmail, 
  getEmailHistory 
} from '../controllers/emailController.js';

const router = express.Router();

// Validation middleware
const validateEmail = [
  body('to')
    .isEmail()
    .withMessage('Please provide a valid recipient email address'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be between 1 and 200 characters'),
  body('text')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Email content cannot be empty'),
  body('html')
    .optional()
    .isString()
    .withMessage('HTML content must be a string')
];

// All routes require authentication
router.use(verifyToken);

/**
 * @route POST /api/email/send
 * @desc Send email for authenticated user
 * @access Private
 */
router.post('/send', validateEmail, sendEmail);

/**
 * @route GET /api/email/status
 * @desc Check if user has connected Gmail
 * @access Private
 */
router.get('/status', getEmailStatus);

/**
 * @route DELETE /api/email/disconnect
 * @desc Disconnect user's Gmail
 * @access Private
 */
router.delete('/disconnect', disconnectGmail);

/**
 * @route GET /api/email/history
 * @desc Get user's email history
 * @access Private
 */
router.get('/history', getEmailHistory);

export default router; 