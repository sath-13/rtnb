import jwt from "jsonwebtoken";
import Admin from "../models/SuperAdmin-model.js";
import crypto from 'crypto';
import User from '../models/user-model.js';
import sendEmail from '../utils/sendEmail.js';
import { AuthMessages, CommonMessages,UserMessages } from "../constants/enums.js";
import { checkEmailAvailabilityService, checkUsersService, forgotPasswordService, googleLoginService, loginUserAdminService,
   registerUserService,
    resetPasswordService, 
    verifyResetTokenService 
  } from "../service/auth.service.js";

//  Register Controller
export const registerUser = async (req, res) => {
  try {
    const result = await registerUserService(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ msg: error.message || CommonMessages.SERVER_ERROR });
  }
};

export const loginUserAdmin = async (req, res) => {
  try {
    const result = await loginUserAdminService(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error(AuthMessages.LOGIN_ERROR, error);
    res.status(400).json({ msg: error.message || CommonMessages.SERVER_ERROR });
  }
};

export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await verifyResetTokenService(token);
    return res.status(result.valid ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ valid: false });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    console.log("Reset password request - New password:", password);
    
    const result = await resetPasswordService(token, password);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const checkUsers = async (req, res) => {
  try {
    const result = await checkUsersService();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const result = await forgotPasswordService(email);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(400).json({ message: error.message });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("🔥 Received email from frontend:", email);
    const { token, user } = await googleLoginService(email);

    res.status(200).json({ success: true, token, user });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ success: false, message: error.message || AuthMessages.SERVER_ERR });
  }
};

export const checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.params;
    const response = await checkEmailAvailabilityService(email);
    res.status(200).json(response);
  } catch (err) {
    console.error("Error checking email availability:", err);
    res.status(500).json({ msg: err.message || CommonMessages.INTERNAL_SERVER_ERROR });
  }
};
