import express from 'express';
import verifyToken from '../middlewares/authMiddleware.js'
import authorizeRoles from '../middlewares/roleMiddleware.js';
import userController from '../controllers/userController.js';

const router = express.Router();

// List all users (admin only)
router.get('/', verifyToken, authorizeRoles('admin'), userController.getUsers);

// Get a single user by ID (admin only)
router.get('/:id', verifyToken, authorizeRoles('admin'), userController.getUserById);

// Create a new user (admin only)
router.post('/', verifyToken, authorizeRoles('admin'), userController.createUser);

// Update a user (admin only)
router.put('/:id', verifyToken, authorizeRoles('admin'), userController.updateUser);

// Delete a user (admin only)
router.delete('/:id', verifyToken, authorizeRoles('admin'), userController.deleteUser);

export default router;