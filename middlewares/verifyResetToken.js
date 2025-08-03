import crypto from 'crypto';
import User from '../models/user-model.js';
import { TokenMessages } from '../constants/enums.js';
import Admin from '../models/SuperAdmin-model.js';

export const verifyResetTokenMiddleware = async (req, res, next) => {
  const { token } = req.params;

  try {
    // Decode the token in case it's URL encoded
    const decodedToken = decodeURIComponent(token);
    
    // First try to find user by raw token
    let user = await User.findOne({
      resetTokenRaw: decodedToken.trim(),
      resetPasswordExpire: { $gt: Date.now() },
    });

    // If not found in User, try Admin
    if (!user) {
      user = await Admin.findOne({
        resetTokenRaw: decodedToken.trim(),
        resetPasswordExpire: { $gt: Date.now() },
      });
    }

    // If not found by raw token, try hashed token (for backward compatibility)
    if (!user) {
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(decodedToken.trim())
        .digest('hex');

      user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      // If not found in User, try Admin
      if (!user) {
        user = await Admin.findOne({
          resetPasswordToken,
          resetPasswordExpire: { $gt: Date.now() },
        });
      }
    }

    // Still not found? Token is invalid or expired
    if (!user) {
      return res.status(400).json({ message: TokenMessages.EXPIRED_TOKEN });
    }

    req.user = user; // Attach found user/admin to req
    next(); // Proceed to the resetPassword controller
  } catch (err) {
    console.error("Error verifying token:", err);
    return res.status(500).json({ message: TokenMessages.TOKEN_VERIFICATION_ERR });
  }
};
