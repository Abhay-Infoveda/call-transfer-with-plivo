import express from 'express';
import { 
  createProject, 
  getProjects, 
  getProject, 
  updateProject, 
  deleteProject 
} from '../controllers/projectController.js';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Project CRUD routes
router.post('/', createProject);
router.get('/', getProjects);
router.get('/:projectId', getProject);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);

export default router; 