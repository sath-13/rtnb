import express from "express";
import { registerUser , resetPassword , verifyResetToken  , checkUsers , forgotPassword, loginUserAdmin , googleLogin, checkEmailAvailability } from "../controllers/authController.js";
import authMiddleware from '../middlewares/authMiddleware.js';  // Import authMiddleware
import { verifySuperAdmin } from '../middlewares/verifySuperAdmin.js';
import { verifyResetTokenMiddleware } from "../middlewares/verifyResetToken.js";
const router = express.Router();

// Register Route: Only accessible by Super Admins
router.post("/register", registerUser);

router.post("/login", loginUserAdmin); // Single login route for both user types
 
// Reset Password Route
router.post("/reset-password/:token", verifyResetTokenMiddleware , resetPassword);

// Verify Reset Token Route
router.get("/verify-reset-token/:token", verifyResetToken);

router.post('/forgot-password', forgotPassword);

router.get("/check-email/:email",checkEmailAvailability);

router.get("/check-users", checkUsers);

router.post("/google-login", googleLogin);
export default router;
