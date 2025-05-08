import express from 'express';
import verifyToken from '../middlewares/authMiddleware.js'
import authorizeRoles from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Only admin can access this route
router.get("/admin", verifyToken, authorizeRoles("admin"),(req, res) => {
    res.json({message: "Welcome Admin"});
})

// Both admin and manager can access this route
router.get("/manager", verifyToken, authorizeRoles("admin", "manager"), (req, res) => {
    res.json({message: "Welcome Manager"});
})

// All can access this route
router.get("/user", verifyToken, authorizeRoles("admin", "manager", "user"),(req, res) => {
    res.json({message: "Welcome User"});
})

export default router;