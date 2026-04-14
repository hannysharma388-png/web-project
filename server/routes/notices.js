import express from 'express';
import { getNotices, createNotice, deleteNotice } from '../controllers/noticeController.js';

import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getNotices);
router.post('/', authorizeRoles('admin', 'faculty'), createNotice);
router.delete('/:id', authorizeRoles('admin', 'faculty'), deleteNotice);

export default router;
