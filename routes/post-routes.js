import express from "express";
import { createPost, getWorkspacePosts,getTeamPosts } from "../controllers/postcontroller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/",authMiddleware ,createPost);
// Route to get workspace posts
router.get("/workspace/:workspaceName", getWorkspacePosts);

// Route to get team posts
router.get("/team/:teamname", getTeamPosts);
export default router;
