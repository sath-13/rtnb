import express from 'express';
import { createComment, getCommentsByActionId, deleteCommentById } from '../controllers/comment.controller.js';
const router = express.Router();

// POST /api/comments  --> Create a new comment or reply
router.post("/", createComment);

// GET /api/comments/:actionId  --> Get comments (with nested replies) for a specific action
router.get("/:actionId", getCommentsByActionId);

// DELETE comment by ID
router.delete("/:commentId", deleteCommentById);


export default router;
