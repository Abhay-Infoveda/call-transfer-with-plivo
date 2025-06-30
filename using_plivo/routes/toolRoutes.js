import express from 'express';
import toolController from '../controllers/toolController.js';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes in this file are protected and require a valid token
router.use(verifyToken);

router.route('/')
  .post(toolController.createTool)
  .get(toolController.getTools);

router.route('/:id')
  .get(toolController.getToolById)
  .put(toolController.updateTool)
  .delete(toolController.deleteTool);

export default router; 