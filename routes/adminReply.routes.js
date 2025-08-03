import express from 'express';
import {
  createAdminReply,
  getAdminReplies
} from '../controllers/adminReplyController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// ✅ POST /admin-replies — Save admin reply to comment (Super Admin only)
router.post('/', authMiddleware, createAdminReply);

// ✅ GET /admin-replies — Get admin replies for specific survey/question (Authenticated users)
router.get('/', authMiddleware, getAdminReplies);

export default router;
