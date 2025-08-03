import Admin from "../models/SuperAdmin-model.js";
import { AuthMessages, CommonMessages, UserMessages } from "../constants/enums.js";
import User from "../models/user-model.js";
import crypto from "crypto";
import { comparePasswords, generateResetToken, generateToken } from "../utils/authutils.js";
import sendEmail from "../utils/sendEmail.js";
import Company from "../models/Company-Model.js";

export const loginUserAdminService = async ({ email, password }) => {
  let user = await Admin.findOne({ email }) || await User.findOne({ email });

  if (!user) {
    throw new Error(AuthMessages.INVALID_EMAIL_PASSWORD);
  }

  if (user.status.toLowerCase() === "inactive") {
    throw new Error(AuthMessages.ACCOUNT_INACTIVE);
  }

  // Use `comparePasswords` from authUtils.js
  const isMatch = await comparePasswords(password, user.password);
  if (!isMatch) {
    throw new Error(AuthMessages.INVALID_EMAIL_PASSWORD);
  }

  // Use `generateToken` from authUtils.js
  const token = generateToken(user);

  // Populate the fields you need from the schema
  const userData = {
    id: user._id,
    fname: user.fname,
    lname: user.lname,
    email: user.email,
    branch: user.branch,
    username: user.username,
    teamTitle: user.teamTitle,
    userLogo: user.userLogo,
    workspaceName: user.workspaceName,
    role: user.role,
    jobRole: user.jobRole,  // Include jobRole field
    companyId: user.companyId,  // Include companyId field
    directManager: user.directManager,  // Include directManager field
    dottedLineManager: user.dottedLineManager,  // Include dottedLineManager field
  };

  return {
    msg: AuthMessages.LOGIN_SUCCESSFUL,
    token,
    user: userData,
  };
};



export const registerUserService = async ({ email, password, confirmPassword, fname, lname, username  }) => {
   if (password !== confirmPassword) {
    throw new Error(AuthMessages.PASSWORD_NOT_MATCH);
  }

 
  const existingUser = await Admin.findOne({ email });
  if (existingUser) {
    throw new Error(AuthMessages.USER_ALREADY_EXIST);
  }


  const user = new Admin({ email, password, fname, lname, username });

  await user.save();

  
  

  // Return success message
  return { msg: AuthMessages.USER_REGISTERED_SUCCESSFULLY };
};



export const verifyResetTokenService = async (token) => {
  try {
    // Decode the token in case it's URL encoded
    const decodedToken = decodeURIComponent(token);
    
    // First try to find user by raw token
    let user = await User.findOne({
      resetTokenRaw: decodedToken.trim(),
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      user = await Admin.findOne({
        resetTokenRaw: decodedToken.trim(),
        resetPasswordExpire: { $gt: Date.now() },
      });
    }

    // If not found by raw token, try hashed token (for backward compatibility)
    if (!user) {
      const resetPasswordToken = crypto.createHash('sha256').update(decodedToken.trim()).digest('hex');
      
      user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        user = await Admin.findOne({
          resetPasswordToken,
          resetPasswordExpire: { $gt: Date.now() },
        });
      }
    }

    const isValid = !!user;
    return { valid: isValid };
  } catch (error) {
    console.error(AuthMessages.ERROR_VERIFYING_TOKEN, error);
    throw new Error(AuthMessages.ERROR_VERIFYING_TOKEN);
  }
};


export const resetPasswordService = async (token, newPassword) => {
  try {
    // Decode the token in case it's URL encoded
    const decodedToken = decodeURIComponent(token);

    // First try to find user by raw token
    let user = await User.findOne({
      resetTokenRaw: decodedToken.trim(),
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      user = await Admin.findOne({
        resetTokenRaw: decodedToken.trim(),
        resetPasswordExpire: { $gt: Date.now() },
      });
    }

    // If not found by raw token, try hashed token (for backward compatibility)
    if (!user) {
      const resetPasswordToken = crypto.createHash('sha256').update(decodedToken.trim()).digest('hex');
      
      user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        user = await Admin.findOne({
          resetPasswordToken,
          resetPasswordExpire: { $gt: Date.now() },
        });
      }
    }

    if (!user) {
      throw new Error(AuthMessages.INVALID_TOKEN);
    }

    // Set the new password
    user.password = newPassword;

    // If user is inactive, activate them
    if (user.status === "inactive") {
      user.status = "active";
    }

    // Clear reset token and expiry
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.resetTokenRaw = undefined;

    console.log("User status before save:", user.status);
    await user.save();
    console.log("User status after save:", user.status);

    return { message: AuthMessages.PASSWORD_RESET_SUCCESS };
  } catch (error) {
    console.error(AuthMessages.ERROR_RESET_PASSWORD, error);
    throw new Error(AuthMessages.ERROR_RESET_PASSWORD);
  }
};


export const checkUsersService = async () => {
  try {
    const userCount = await Admin.countDocuments();
    return { userExists: userCount > 0 };
  } catch (error) {
    console.error(AuthMessages.ERROR_CHECKING_USER, error);
    throw new Error(CommonMessages.SERVER_ERROR);
  }
};

export const forgotPasswordService = async (email) => {
  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = await Admin.findOne({ email }); // Check in Admin model if not found in User
    }

    if (!user) {
      throw new Error(AuthMessages.NO_USER_FOUND);
    }

    // Generate reset token using the utility function
    const { resetPasswordToken, hashedResetToken, resetPasswordExpire } = generateResetToken();

    // Save the token and expiration in the user document
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpire = resetPasswordExpire;
    user.resetTokenRaw = resetPasswordToken;
    await user.save();


    // Send the email with the reset link
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetPasswordToken}`;

    // Use the proper email template
    const htmlMessage = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Request</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f9;
              margin: 0;
              padding: 0;
            }
            .container {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
              border-radius: 8px;
            }
            h1 {
              color: #333333;
            }
            p {
              color: #555555;
              line-height: 1.5;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              margin: 20px 0;
              color: #ffffff;
              background-color: #4CAF50;
              text-decoration: none;
              border-radius: 5px;
            }
            .footer {
              font-size: 12px;
              color: #777777;
              text-align: center;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Password Reset Request</h1>
            <p>Hello ${user.fname} ${user.lname},</p>
            <p>You requested a password reset for your Reteam account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>Best regards,<br>Reteam</p>
            <div class="footer">
              <p>&copy; 2025 Reteam. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      email,
      subject: "Password Reset Request - Reteam",
      html: htmlMessage,
    });

    return { message: AuthMessages.RESENT_EMAIL_SENT };
  } catch (error) {
    console.error(AuthMessages.ERROR_FORGOT_PASSWORD, error);
    
    // If it's already a specific error (like "No user found"), re-throw it
    if (error.message === AuthMessages.NO_USER_FOUND) {
      throw error;
    }
    
    // For other errors (like email sending failures), throw the generic error
    throw new Error(AuthMessages.ERROR_SENDING_EMAIL);
  }
};

export const googleLoginService = async (email) => {
  
  let user = await User.findOne({ email }) || await Admin.findOne({ email });

  if (!user) {
    throw new Error(AuthMessages.EMAIL_NOT_REGISTRED_ERR);
  }

  // Prevent login if user is inactive
  if (user.status?.toLowerCase() === "inactive") {
    throw new Error(AuthMessages.ACCOUNT_INACTIVE);
  }

  // Generate JWT token
  const token = generateToken(user);

  return { token, user };
};


export const checkEmailAvailabilityService = async (email) => {
  if (!email) {
    throw new Error(UserMessages.EMAIL_REQUIRED);
  }

  const lowerCaseEmail = email.toLowerCase();

  // Only check Admin collection since this is for super admin registration
  const existingAdmin = await Admin.findOne({ email: lowerCaseEmail });

  if (existingAdmin) {
    throw new Error(UserMessages.EMAIL_ALREADY_TAKEN);
  }

  return { msg: UserMessages.EMAIL_AVAILABLE };
};
