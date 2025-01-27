import express from 'express';
import { signup, login, getUserByEmail, getAllUsers } from "../controller/user.controller.js";
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes - using the existing protect middleware
router.get('/email/:email', authenticateUser, getUserByEmail);
router.get('/all', authenticateUser, getAllUsers);

export default router;