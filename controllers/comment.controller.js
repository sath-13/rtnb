import { createCommentService, getCommentsByActionIdService, deleteCommentByIdService } from "../service/comment.service.js";

export const createComment = async (req, res) => {
    try {
        const savedComment = await createCommentService(req.body);
        res.status(201).json(savedComment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCommentsByActionId = async (req, res) => {
    try {
        const comments = await getCommentsByActionIdService(req.params.actionId);
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteCommentById = async (req, res) => {
  try {
    const deleted = await deleteCommentByIdService(req.params.commentId);
    if (!deleted) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};