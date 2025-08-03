import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePasswords = async (enteredPassword, storedPassword) => {
  return bcrypt.compare(enteredPassword, storedPassword);
};

export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role, 
      branch: user.branch,
      username: user.username  // Add username to JWT token
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const generateResetToken = () => {
  const resetPasswordToken = crypto.randomBytes(20).toString("hex");
  const hashedResetToken = crypto.createHash("sha256").update(resetPasswordToken).digest("hex");
  const resetPasswordExpire = Date.now() + 3600000; // Token valid for 1 hour

  return { resetPasswordToken, hashedResetToken, resetPasswordExpire };
};
