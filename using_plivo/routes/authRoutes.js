import express from 'express';
import authController from '../controllers/authController.js'; // import the full object

const router = express.Router();

router.post('/register', authController.register); // ✅ use functions from the object
router.post('/login', authController.login);       // ✅

export default router;
