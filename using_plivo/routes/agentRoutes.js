import express from 'express';
import agentController from '../controllers/agentController.js';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(verifyToken);

router.route('/')
  .post(agentController.createAgent)
  .get(agentController.getAgents);

router.route('/:id')
  .get(agentController.getAgentById)
  .put(agentController.updateAgent)
  .delete(agentController.deleteAgent);

export default router; 