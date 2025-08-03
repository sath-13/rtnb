import express from "express";
import { getAllHiringRequests, submitHiringRequest, makeDecision, getAllUsers, getJobById, getUsersInWorkspace } from "../controllers/hiringController.js";

const router = express.Router();

router.post("/save", submitHiringRequest);
router.get('/', getAllHiringRequests);
router.patch('/:id/decision', makeDecision);
router.get('/users', getAllUsers);
router.get("/jobs/:id", getJobById);
router.get('/workspace/:workspaceId', getUsersInWorkspace);

export default router;
