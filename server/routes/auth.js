import express from 'express';
import { loginUser, refreshToken, logoutUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/refresh', refreshToken);
router.post('/logout', logoutUser);

export default router;
