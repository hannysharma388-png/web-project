import express from 'express';
import { getUsers, createUser, deleteUser } from '../controllers/userController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateUserCreate } from '../middleware/validators.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getUsers);
router.post('/', authorizeRoles('admin'), validateUserCreate, createUser);
router.delete('/:id', authorizeRoles('admin'), deleteUser);

export default router;
