import express from 'express';
import { createBadge ,  assignBadge, getAllBadges ,getAllSuperadminBadges,getUserBadges, deleteBadge, getAssignedPublicBadges , getAssignedTeamBadges } from '../controllers/badgeController.js';  // Import controller function
import authMiddleware from '../middlewares/authMiddleware.js';
const router = express.Router();
// Route for creating a badge
router.post('/create',authMiddleware, createBadge);
router.post('/assigned-badge', assignBadge);
router.get("/get-all/:workspacename", getAllBadges);
router.get("/get-allbadges",authMiddleware, getAllSuperadminBadges);
router.get("/get-badges",authMiddleware, getUserBadges);
router.get("/user-badges/:userId", getUserBadges);    // uses req.params.userId
router.delete("/:id", deleteBadge);
router.get("/publicBadges/:workspacename", getAssignedPublicBadges);
router.get("/teamBadges/:team", getAssignedTeamBadges); 


export default router;
