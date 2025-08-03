import express from "express";
import {
  createInternalNode,
  getInternalNodesByUser,
} from "../controllers/internalNodesController.js";

const router = express.Router();

// Create internal node
router.post("/", createInternalNode);

// Get internal nodes given to a user
router.get("/:userId", getInternalNodesByUser);

export default router;
