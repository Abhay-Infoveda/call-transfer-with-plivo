import express from 'express';
import verifyToken from '../middlewares/authMiddleware.js';
import {
  createContactFromCall,
  createLeadFromCall,
  searchContacts,
  updateContact,
  createDealFromCall,
  getZohoStatus
} from '../controllers/zohoController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

/**
 * @route GET /api/zoho/status
 * @desc Get Zoho integration status
 * @access Private
 */
router.get('/status', getZohoStatus);

/**
 * @route POST /api/zoho/contacts
 * @desc Create a new contact from call data
 * @access Private
 */
router.post('/contacts', createContactFromCall);

/**
 * @route POST /api/zoho/leads
 * @desc Create a new lead from call data
 * @access Private
 */
router.post('/leads', createLeadFromCall);

/**
 * @route GET /api/zoho/contacts/search
 * @desc Search for existing contacts
 * @access Private
 */
router.get('/contacts/search', searchContacts);

/**
 * @route PUT /api/zoho/contacts/:contactId
 * @desc Update contact information
 * @access Private
 */
router.put('/contacts/:contactId', updateContact);

/**
 * @route POST /api/zoho/deals
 * @desc Create a new deal/opportunity from call data
 * @access Private
 */
router.post('/deals', createDealFromCall);

export default router; 