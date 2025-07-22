import express from 'express';
import { 
  createAgent, 
  getAgents, 
  getAgent, 
  updateAgent, 
  deleteAgent 
} from '../controllers/agentController.js';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Agent routes within project context
router.post('/:projectId/agents', createAgent);
router.get('/:projectId/agents', getAgents);
router.get('/:projectId/agents/:agentId', getAgent);
router.put('/:projectId/agents/:agentId', updateAgent);
router.delete('/:projectId/agents/:agentId', deleteAgent);

export default router; 