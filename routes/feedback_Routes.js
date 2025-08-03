import express from "express";
import {
  getPendingFeedbackRequests,
  getUserFeedback,
  getLoggedInUserFeedback,
  sendRequestedFeedbacks,
  submitRequestedFeedback,
  submitDirectFeedback,
  declineFeedbackRequest,
} from "../controllers/userFeedbackController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, submitDirectFeedback);           // Submit feedback
router.get("/loggedinuser", getLoggedInUserFeedback);             // Logged-in user feedback
router.get("/:userId", authMiddleware, getUserFeedback);          // Specific user feedback
router.get("/pending/:userId", getPendingFeedbackRequests);       // Pending requests
router.post("/decline/:id", declineFeedbackRequest);              // Decline request
router.post("/submitReview", sendRequestedFeedbacks);             // Request feedback
router.post("/requested", submitRequestedFeedback);               // Submit requested

export default router;
