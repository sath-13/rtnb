import User from "../models/user-model.js";
import Admin from "../models/SuperAdmin-model.js";
import CompanyRole from "../models/CompanyRole-model.js";
import RoleAccess from "../models/RoleAccess-Model.js";
import Teams from '../models/team-model.js';
// import Streams from '../models/stream-model.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import StatusCodes from 'http-status-codes';
import config from "../config.js";
import { getResetPasswordTemplate } from '../utils/emailTemplates.js';
import Workspace from "../models/workspace-model.js";

import ImportedUserProfile from "../models/ImportedUserProfile.js";
import multer from "multer";
import xlsx from "xlsx";
import { ActionMessages, CommentMessages, CommonMessages, UserMessages } from "../constants/enums.js";
import { getUsersFromWorkspaces } from "../service/user.service.js";
import mongoose from "mongoose";
import { generateResetToken } from "../utils/authutils.js";
// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Copy all fields from req.body dynamically
    let updateData = { ...req.body };

    // Handle file upload (user icon) if present
    if (req.file) {
      const mimeType = req.file.mimetype;
      if (!["image/png", "image/jpeg"].includes(mimeType)) {
        return res.status(400).json({ msg: UserMessages.INVALID_FILE_TYPE });
      }
      const logoBase64 = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;
      updateData.userLogo = logoBase64;
    }

    // Try updating the User collection
    let updatedDoc = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    // If not found in User, try Admin
    if (!updatedDoc) {
      updatedDoc = await Admin.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedDoc) {
        return res.status(404).json({ msg: UserMessages.USER_NOT_FOUND });
      }
    }

    return res.status(200).json({
      msg: UserMessages.USER_UPDATED_SUCCESSFULLY,
      user: updatedDoc,
    });
  } catch (error) {
    console.error(UserMessages.ERROR_UPDATING_USER, error);
    return res.status(500).json({
      msg: UserMessages.ERROR_UPDATING_USER,
      error: error.message,
    });
  }
};


export { upload };

export const createUser = async (req, res) => {
  const {
    fname, lname, username, email, password,
    role, status, teamTitle, workspaceName, branch,
    companyId, jobRole, imported, directManager, dottedLineManager
  } = req.body;

  try {
    let finalUsername = username;

    if (!username || username.trim() === "") {
      let baseUsername = `${fname.toLowerCase()}${lname.toLowerCase()}`.replace(/\s+/g, "");
      finalUsername = baseUsername;
      let count = 1;
      while (await User.findOne({ username: finalUsername }) || await Admin.findOne({ username: finalUsername })) {
        finalUsername = `${baseUsername}${count}`;
        count++;
      }
    }

    const workspaceNames = workspaceName 
      ? (Array.isArray(workspaceName) ? workspaceName : workspaceName.split(",").map(w => w.trim()))
      : [];

    // Only check for existing user in the specific workspace
    const existingUser = await User.findOne({ 
      email,
      workspaceName: { $in: workspaceNames } 
    });

    if (existingUser) {
      return res.status(400).json({ msg: UserMessages.USER_ALREADY_EXIST });
    }

    // Only block if trying to create another superadmin with same email
    if (role === "superadmin") {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ msg: UserMessages.USER_ALREADY_EXIST });
      }
    }

    const workspaces = await Workspace.find({ workspacename: { $in: workspaceNames } });

    const userLogo = " ";

    const userData = {
      fname,
      lname,
      username: finalUsername,
      email,
      password,
      role,
      branch,
      status: status || "inactive",
      workspaceName: workspaceNames,
      teamTitle: teamTitle ? (Array.isArray(teamTitle) ? teamTitle : teamTitle.split(",").map(t => t.trim())) : [],
      userLogo: userLogo || " ",
      companyId,
      jobRole,
      imported,
      directManager,
      dottedLineManager,
    };

    let createdUser;
    if (role === "superadmin") {
      createdUser = new Admin(userData);
    } else {
      createdUser = new User(userData);
    }

    await createdUser.save();

    // Add job role to CompanyRole table if it doesn't exist
    if (jobRole && companyId) {
      await addJobRoleToCompany(companyId, jobRole);
    }

    // Add role to RoleAccess table if it doesn't exist
    if (role && companyId) {
      await addRoleToAccessMatrix(companyId, role);
    }

    // Use the utility function for consistent token generation
    const { resetPasswordToken, hashedResetToken, resetPasswordExpire } = generateResetToken();

    createdUser.resetPasswordToken = hashedResetToken;
    createdUser.resetPasswordExpire = resetPasswordExpire;
    createdUser.resetTokenRaw = resetPasswordToken;
    await createdUser.save();

    const resetUrl = `${config.CLIENT_URL}/reset-password/${resetToken}`;
    const htmlMessage = getResetPasswordTemplate(fname, lname, email, resetUrl, workspaceNames);

    await sendEmail({
      email: createdUser.email,
      subject: 'Set Your Password - Reteam',
      html: htmlMessage,
    });

    res.status(201).json({
      msg: UserMessages.USER_CREATED_RESET_SENT,
      user: createdUser,
    });
  } catch (err) {
    console.error(UserMessages.ERROR_CREATING_USER, err);
    res.status(500).json({
      msg: UserMessages.ERROR_CREATING_USER,
      error: err.message,
    });
  }
};


// Helper function to clean manager name
const cleanManagerName = (name) => {
  if (!name || name.trim() === "") return null;
  return name.trim();
};

// Helper function to add job role to CompanyRole table if it doesn't exist
const addJobRoleToCompany = async (companyId, jobRole) => {
  if (!companyId || !jobRole || jobRole.trim() === "") return;
  
  try {
    // Check if job role already exists for this company
    const existingRole = await CompanyRole.findOne({ 
      companyId: companyId, 
      roleName: jobRole.trim() 
    });
    
    if (!existingRole) {
      // Add new job role to CompanyRole table
      const newRole = new CompanyRole({
        companyId: companyId,
        roleName: jobRole.trim(),
        description: `Job role imported from user data: ${jobRole.trim()}`
      });
      await newRole.save();
      console.log(`Added new job role: ${jobRole.trim()} for company: ${companyId}`);
    }
  } catch (error) {
    console.error(`Error adding job role ${jobRole} to company ${companyId}:`, error);
  }
};

// Helper function to add role to RoleAccess table if it doesn't exist
const addRoleToAccessMatrix = async (companyId, role) => {
  if (!companyId || !role || role.trim() === "") return;
  
  try {
    // Check if role already exists for this company
    const existingRole = await RoleAccess.findOne({ 
      companyId: companyId, 
      roleName: role.trim() 
    });
    
    if (!existingRole) {
      // Define all modules that need access entries
      const modules = ['Home', 'My Organization', 'System & Accessories', 'Actions', 'Domain Setup', 'Portfolio', 'Project Calendar', 'Events', 'Hiring', 'Inbox'];
      
      // Create access entries for each module
      const accessEntries = modules.map(moduleName => ({
        companyId: companyId,
        roleName: role.trim(),
        moduleName: moduleName,
        access: 0, // default to no access
      }));
      
      await RoleAccess.insertMany(accessEntries);
      console.log(`Added new role: ${role.trim()} for company: ${companyId} with ${modules.length} module access entries`);
    }
  } catch (error) {
    console.error(`Error adding role ${role} to company ${companyId}:`, error);
  }
};

export const importUsers = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: UserMessages.NO_FILE_UPLOADED });

    const workspaceName = req.body.workspaceName;
    if (!workspaceName) return res.status(400).json({ message: UserMessages.WORKSPACE_NAME_REQ });

    const workspace = await Workspace.findOne({
      workspacename: { $regex: new RegExp(`^${workspaceName}$`, "i") },
    });

    if (!workspace) return res.status(400).json({ message: UserMessages.WORKSPACE_NOT_FOUND });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (sheetData.length === 0) {
      return res.status(400).json({ message: UserMessages.EMPTY_FILE_UPLOADED });
    }

    const emails = sheetData.map(row => row.email);

    // Fetch existing users & admins by email
    const existingUsers = await User.find({ email: { $in: emails } });
    const existingAdmins = await Admin.find({ email: { $in: emails } });

    // Create a map of existing users and admins by email
    const userMap = new Map();
    existingUsers.forEach(user => userMap.set(user.email, user));
    existingAdmins.forEach(admin => userMap.set(admin.email, admin)); // Include admins in check

    const existingUsersInWorkspace = await User.find({
      email: { $in: emails },
      workspaceName: workspaceName,
    });

    const existingCount = existingUsersInWorkspace.length;
    const usersToInsert = [];
    const usersToUpdate = [];
    const usersToEmail = [];
    
    console.log(`📊 Import Summary: ${sheetData.length} rows in file, ${existingUsers.length} existing users, ${existingAdmins.length} existing admins`);
    
    // Check email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(`⚠️ Email credentials not configured. Password reset emails will not be sent.`);
    }

    for (const row of sheetData) {
      const existingUserOrAdmin = userMap.get(row.email);

      if (existingUserOrAdmin) {
        // If the email exists in either User or Admin model, check workspace info
        if (existingUserOrAdmin instanceof User) {
          const existingWorkspaceIndex = existingUserOrAdmin.workspaceName.findIndex(
            (name) => name === workspaceName
          );

          if (existingWorkspaceIndex === -1) {
            existingUserOrAdmin.workspaceName.push(workspaceName);
          }
          
          // Update other fields from the import data
          if (row.teamTitle) {
            existingUserOrAdmin.teamTitle = Array.isArray(row.teamTitle) ? row.teamTitle : row.teamTitle.split(",").map(t => t.trim());
          }
          if (row.companyId) existingUserOrAdmin.companyId = row.companyId;
          if (row.jobRole) {
            existingUserOrAdmin.jobRole = row.jobRole;
            // Add job role to CompanyRole table if it doesn't exist
            await addJobRoleToCompany(row.companyId, row.jobRole);
          }
          if (row.role) {
            existingUserOrAdmin.role = row.role;
            // Add role to RoleAccess table if it doesn't exist
            await addRoleToAccessMatrix(row.companyId, row.role);
          }
          if (row.directManager) {
            existingUserOrAdmin.directManager = cleanManagerName(row.directManager);
          }
          if (row.dottedLineManager) {
            existingUserOrAdmin.dottedLineManager = cleanManagerName(row.dottedLineManager);
          }
          if (row.status) existingUserOrAdmin.status = row.status;
          if (row.branch) existingUserOrAdmin.branch = row.branch;
          
          // Check if critical fields have changed (email, password, or if user has no reset token)
          const criticalFieldsChanged = 
            existingUserOrAdmin.email !== row.email ||
            !existingUserOrAdmin.resetPasswordToken ||
            !existingUserOrAdmin.resetPasswordExpire ||
            new Date(existingUserOrAdmin.resetPasswordExpire) < new Date();
          
          if (criticalFieldsChanged) {
            // Generate new reset token only if critical fields changed
            const { resetPasswordToken, hashedResetToken, resetPasswordExpire } = generateResetToken();
            existingUserOrAdmin.resetPasswordToken = hashedResetToken;
            existingUserOrAdmin.resetPasswordExpire = resetPasswordExpire;
            existingUserOrAdmin.resetTokenRaw = resetPasswordToken;
            usersToEmail.push(existingUserOrAdmin); // Add to email list for resending reset emails
            console.log(`🔄 User ${existingUserOrAdmin.email}: Critical fields changed, new reset token generated`);
          } else {
            console.log(`✅ User ${existingUserOrAdmin.email}: Updated without generating new reset token`);
          }
          
          usersToUpdate.push(existingUserOrAdmin);
        } else {
          // Handle Admin users
          if (row.teamTitle) {
            existingUserOrAdmin.teamTitle = Array.isArray(row.teamTitle) ? row.teamTitle : row.teamTitle.split(",").map(t => t.trim());
          }
          if (row.companyId) existingUserOrAdmin.companyId = row.companyId;
          if (row.jobRole) {
            existingUserOrAdmin.jobRole = row.jobRole;
            // Add job role to CompanyRole table if it doesn't exist
            await addJobRoleToCompany(row.companyId, row.jobRole);
          }
          if (row.role) {
            existingUserOrAdmin.role = row.role;
            // Add role to RoleAccess table if it doesn't exist
            await addRoleToAccessMatrix(row.companyId, row.role);
          }
          if (row.directManager) {
            existingUserOrAdmin.directManager = cleanManagerName(row.directManager);
          }
          if (row.dottedLineManager) {
            existingUserOrAdmin.dottedLineManager = cleanManagerName(row.dottedLineManager);
          }
          if (row.status) existingUserOrAdmin.status = row.status;
          if (row.branch) existingUserOrAdmin.branch = row.branch;
          
          // Check if critical fields have changed (email, password, or if admin has no reset token)
          const criticalFieldsChanged = 
            existingUserOrAdmin.email !== row.email ||
            !existingUserOrAdmin.resetPasswordToken ||
            !existingUserOrAdmin.resetPasswordExpire ||
            new Date(existingUserOrAdmin.resetPasswordExpire) < new Date();
          
          if (criticalFieldsChanged) {
            // Generate new reset token only if critical fields changed
            const { resetPasswordToken, hashedResetToken, resetPasswordExpire } = generateResetToken();
            existingUserOrAdmin.resetPasswordToken = hashedResetToken;
            existingUserOrAdmin.resetPasswordExpire = resetPasswordExpire;
            existingUserOrAdmin.resetTokenRaw = resetPasswordToken;
            usersToEmail.push(existingUserOrAdmin); // Add to email list for resending reset emails
            console.log(`🔄 Admin ${existingUserOrAdmin.email}: Critical fields changed, new reset token generated`);
          } else {
            console.log(`✅ Admin ${existingUserOrAdmin.email}: Updated without generating new reset token`);
          }
          
          usersToUpdate.push(existingUserOrAdmin);
        }
      } else {
        // New email -> Generate unique username
        let baseUsername = `${row.fname.toLowerCase()}${row.lname.toLowerCase()}`.replace(/\s+/g, "");
        let finalUsername = row.username || baseUsername;
        let count = 1;

        // Check username in both User and Admin models
        while (
          await User.findOne({ username: finalUsername }) 
        
        ) {
          finalUsername = `${baseUsername}${count}`;
          count++;
        }

        // Generate reset token using utility function
        const { resetPasswordToken, hashedResetToken, resetPasswordExpire } = generateResetToken();

        const newUser = {
          fname: row.fname,
          lname: row.lname,
          username: finalUsername,  // <-- Unique username across both models
          email: row.email,
          password: " ",
          role: row.role || "user",
          branch: row.branch || "Goa",
          workspaceName: [workspaceName],
          userLogo: row.userLogo || " ",
          status: row.status || "inactive",
          teamTitle: row.teamTitle ? (Array.isArray(row.teamTitle) ? row.teamTitle : row.teamTitle.split(",").map(t => t.trim())) : [],
          companyId: row.companyId || "",
          jobRole: row.jobRole || "",
          imported: row.imported !== undefined ? row.imported : true,
          directManager: cleanManagerName(row.directManager),
          dottedLineManager: cleanManagerName(row.dottedLineManager),
          resetPasswordToken: hashedResetToken,
          resetPasswordExpire,
          resetTokenRaw: resetPasswordToken,
        };

        // Add job role to CompanyRole table if it doesn't exist
        if (row.jobRole && row.companyId) {
          await addJobRoleToCompany(row.companyId, row.jobRole);
        }
        
        // Add role to RoleAccess table if it doesn't exist
        if (row.role && row.companyId) {
          await addRoleToAccessMatrix(row.companyId, row.role);
        }

        usersToInsert.push(newUser);
        usersToEmail.push(newUser);
      }
    }

    // Insert new users
    if (usersToInsert.length > 0) {
      await User.insertMany(usersToInsert);
    }

    // Update existing users to append workspace info
    await Promise.all(usersToUpdate.map(user => user.save()));

    // Send reset emails only for users who need them
    if (usersToEmail.length > 0) {
      console.log(`📧 Sending password reset emails to ${usersToEmail.length} users`);
      
      const emailResults = await Promise.allSettled(
        usersToEmail.map(async (user) => {
          const resetUrl = `${config.CLIENT_URL}/reset-password/${user.resetTokenRaw}`;

          const htmlMessage = getResetPasswordTemplate(
            user.fname,
            user.lname,
            user.email,
            resetUrl,
            user.workspaceName,
          );

          return await sendEmail({
            email: user.email,
            subject: "Set Your Password - Reteam",
            html: htmlMessage,
          });
        })
      );
      
      // Count successful and failed emails
      const successfulEmails = emailResults.filter(result => result.status === 'fulfilled').length;
      const failedEmails = emailResults.filter(result => result.status === 'rejected').length;
      
      console.log(`📧 Email Results: ${successfulEmails} sent successfully, ${failedEmails} failed`);
      
      if (failedEmails > 0) {
        console.warn(`⚠️ Some emails failed to send. Users can still reset passwords using the reset link.`);
      }
    } else {
      console.log(`📧 No password reset emails needed`);
    }

    res.json({
      message: `${usersToInsert.length} new users added successfully, ${usersToUpdate.length} existing users were updated, ${usersToEmail.length} users will receive password reset emails, and ${existingCount} users were already in the system.`,
    });
  } catch (error) {
    console.error("Import error", error);
    res.status(500).json({ message: UserMessages.IMPORT_USER_ERR, error: error.message });
  }
};


export const resendResetEmails = async (req, res) => {
  try {
    const { workspaceName } = req.body;
    if (!workspaceName) {
      return res.status(400).json({ message: UserMessages.WORKSPACE_NAME_REQ});
    }

    // Fetch inactive users in the given workspace
    let inactiveUsers = await User.find({ workspaceName, status: "inactive" });

    if (inactiveUsers.length === 0) {
      return res.status(400).json({ message: UserMessages.NO_INACTIVE_USER });
    }

    // Ensure users have valid reset tokens
    inactiveUsers = await Promise.all(
      inactiveUsers.map(async (user) => {
        if (!user.resetTokenRaw || user.resetPasswordExpire < Date.now()) {
          const { resetPasswordToken, hashedResetToken, resetPasswordExpire } = generateResetToken();
          user.resetPasswordToken = hashedResetToken;
          user.resetPasswordExpire = resetPasswordExpire;
          user.resetTokenRaw = resetPasswordToken;
          await user.save();  // Save updated token
        }
        return user;
      })
    );

    // Resend reset emails
    await Promise.all(
      inactiveUsers.map(async (user) => {
        const resetUrl = `${config.CLIENT_URL}/reset-password/${user.resetTokenRaw}`;
       

        const htmlMessage = getResetPasswordTemplate(
          user.fname,
          user.lname,
          user.email,
          resetUrl,
          user.workspaceName,
        );

        await sendEmail({
          email: user.email,
          subject: "Set Your Password - Reteam (Reminder)",
          html: htmlMessage,
        });
      })
    );

    res.json({ message: `Reset emails resent to ${inactiveUsers.length} users.` });
  } catch (error) {
    console.error("Resend email error", error);
    res.status(500).json({ message: UserMessages.RESEND_EMAILS_ERR, error: error.message });
  }
};


export const transferUsersToWorkspace = async (req, res) => {
  try {
    const { userIds, targetWorkspace } = req.body;

    // Check if target workspace exists
    const workspace = await Workspace.findOne({ workspacename: targetWorkspace });
    if (!workspace) {
      return res.status(404).json({ message: UserMessages.TARGET_WORKSPACE_NOT_FOUND });
    }

    // Update users' workspace
    await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { workspaceName: workspace.workspacename } } // Use workspaceName, not _id
    );

    res.status(200).json({ message: UserMessages.USER_TRANSFER_SUCC });
  } catch (error) {
    console.error("Error transferring users:", error);
    res.status(500).json({ message: UserMessages.INTERNAL_SERV_ERR });
  }
};


export const replicaUsersToWorkspace = async (req, res) => {
  try {
    const { userIds, targetWorkspace } = req.body;


    // Check if target workspace exists
    const workspace = await Workspace.findOne({ workspacename: targetWorkspace });
    if (!workspace) {
      return res.status(404).json({ message: UserMessages.TARGET_WORKSPACE_NOT_FOUND });
    }

    // Fetch existing users
    const usersToUpdate = await User.find({ _id: { $in: userIds } });

    usersToUpdate.forEach(user => {
      if (!user.workspaceName.includes(workspace.workspacename)) {
        user.workspaceName.push(workspace.workspacename);
      }
    });

    // Save updated users
    await Promise.all(usersToUpdate.map(user => user.save()));

    res.status(200).json({ message: UserMessages.USER_REPLICA_SUCC });
  } catch (error) {
    console.error("Error replicating users:", error);
    res.status(500).json({ message: UserMessages.INTERNAL_SERV_ERR });
  }
};

export const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params;
    const lowerUsername = username.toLowerCase();

    // Check in both Admin and User collections
    const existingUser = await User.findOne({ username: lowerUsername });
    const existingAdmin = await Admin.findOne({ username: lowerUsername });

    if (existingUser || existingAdmin) {
      return res.status(400).json({ msg: UserMessages.USERNAME_ALREADY_TAKEN });
    }

    res.status(200).json({ msg: UserMessages.USERNAME_IS_AVAILABLE });
  } catch (err) {
    console.error(UserMessages.ERROR_CHECKING_USERNAME, err);
    res.status(500).json({ msg: CommonMessages.INTERNAL_SERVER_ERROR });
  }
};


export const checkEmailAvailability = async (req, res) => {
  try {
    const { email, workspaceName } = req.params;

    if (!email || !workspaceName) {
      return res.status(400).json({ msg: UserMessages.EMAIL_AND_WORKSPACENAME_REQ });
    }

    const lowerCaseEmail = email.toLowerCase();

    // Only check if the email exists as a user in this specific workspace
    const existingUser = await User.findOne({ 
      email: lowerCaseEmail, 
      workspaceName 
    });

    if (existingUser) {
      return res.status(400).json({ msg: UserMessages.EMAIL_ALREADY_TAKEN });
    }

    // Allow admin emails to be added as regular users
    res.status(200).json({ msg: UserMessages.EMAIL_AVAILABLE });

  } catch (err) {
    console.error(UserMessages.ERROR_CHECKING_EMAIL, err);
    res.status(500).json({ msg: CommentMessages.INTERNAL_SERVER_ERROR });
  }
};


export const getUsersInWorkspace = async (req, res) => {
  try {
    const { workspaceName } = req.params;
    const { imported } = req.query;

    let filter = { workspaceName: { $in: [workspaceName] } };

    if (imported === "true") {
      filter.imported = true;
    }

    // Query Users and superAdmins
    const Users = await User.find(filter);
    const superAdmins = await Admin.find(filter);  // Change from findOne to find

    // Combine both users and superadmins
    const users = [...superAdmins, ...Users];

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: UserMessages.ERROR_FETCHING_USERS, error });
    console.error(error);
  }
};



export const getUsersByStream = async (req, res) => {
  const { streamTitle, workspaceName } = req.params;

  try {
      let usersInTeams = [];

      // If fetching unassigned users only
      if (streamTitle === "unassigned_users") {
          usersInTeams = await User.find({
              workspaceName,
              teamTitle: { $size: 0 }  // Users with no team assigned
          }).select('_id fname lname username email role');
      } else {
          // Fetch teams assigned to the stream
          const teams = await Teams.find({ stream: streamTitle, workspaceName }).select('teamTitle');
          const teamTitles = teams.map(team => team.teamTitle);

          // Fetch users assigned to the teams
          usersInTeams = await User.find({ 
              teamTitle: { $in: teamTitles }, 
              workspaceName 
          }).select('_id fname lname username email role');
      }

      //Fetch the SuperAdmin user from the workspace
      const superAdmin = await Admin.findOne({ workspaceName }).select('_id fname lname email').lean();
      const superAdminUser = superAdmin ? [{ 
          _id: superAdmin._id, 
          fname: superAdmin.fname, 
          lname: superAdmin.lname, 
          email: superAdmin.email, 
          role: 'superadmin' 
      }] : [];

      // Combine all users
      const allUsers = [...superAdminUser, ...usersInTeams];

      res.status(200).json(allUsers);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

export const deleteUserFromWorkspace = async (req, res) => {
  try {
    const { id } = req.params; // User/Admin ID
    const { workspaceName } = req.body; // Workspace to remove

    // Check if the user is a regular user
    let user = await User.findById(id);
    let isAdmin = false;

    // If the user is not found, check if it's an admin (superadmin)
    if (!user) {
      user = await Admin.findById(id); // Check Admin model for superadmin
      isAdmin = true; // Set flag for admin
    }

    if (!user) {
      return res.status(404).json({ message: UserMessages.USER_NOT_FOUND });
    }

    // If the user (or admin) has multiple workspaces, remove only the specified one
    if (user.workspaceName.length > 1) {
      user.workspaceName = user.workspaceName.filter(name => name !== workspaceName);
      await user.save();
      return res.status(200).json({ message: `User removed from workspace ${workspaceName}` });
    }

    // If the user (or admin) has only one workspace, delete the entire user (or admin)
    if (isAdmin) {
      await Admin.findByIdAndDelete(id);  // Deleting superadmin
      return res.status(200).json({ message: UserMessages.ADMIN_DELETED_SUCCESSFULLY });
    } else {
      await User.findByIdAndDelete(id);  // Deleting regular user
      return res.status(200).json({ message: UserMessages.USER_DELETED_SUCCESSFULLY });
    }

  } catch (error) {
    console.error("Error deleting user/admin:", error);
    res.status(500).json({ message: UserMessages.FAILED_TO_DELETE_USER, error: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body; // Get new status from request body
    const id = req.params.id; // Extract user ID from URL

    // Check if the user is a regular user or an admin (superadmin)
    let user = await User.findById(id);
    let isAdmin = false;

    if (!user) {
      user = await Admin.findById(id); // Check Admin model for superadmin
      isAdmin = true; // Set flag for admin
    }

    if (!user) {
      return res.status(404).json({ message: UserMessages.USER_NOT_FOUND });
    }

    // Update status based on user type (regular user or admin)
    user.status = status;
    await user.save();

    res.json({
      message: ActionMessages.STATUS_UPDATED,
      updatedUser: user, // Return the updated user object
    });
  } catch (error) {
    res.status(500).json({
      message: CommentMessages.INTERNAL_SERVER_ERROR,
      error: error.message,
    });
    console.error(error);
  }
};


export const updateUserTeamTitle = async (req, res) => {
  try {
    const { teamTitle } = req.body; // Get new teamTitle from request body
    const id = req.params.id; // Extract user ID from URL

    // Check if the user is a regular user or an admin (superadmin)
    let user = await User.findById(id);
    let isAdmin = false;

    if (!user) {
      user = await Admin.findById(id); // Check Admin model for superadmin
      isAdmin = true; // Set flag for admin
    }

    if (!user) {
      return res.status(404).json({ message: UserMessages.USER_NOT_FOUND });
    }

    // Update teamTitle based on user type (regular user or admin)
    user.teamTitle = teamTitle;
    await user.save();

    res.json({
      message: ActionMessages.TEAM_TITLE_UPDATED,
      updatedTeamTitle: user, // Return the updated user object
    });
  } catch (error) {
    res.status(500).json({
      message: CommonMessages.INTERNAL_SERVER_ERROR,
      error: error.message,
    });
    console.error(error);
  }
};


// Fetch user details based on an array of IDs
export const getUsernamesByIds = async (req, res) => {
  try {
    const { userIds } = req.body; // Receive an array of user IDs

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: UserMessages.INVALID_USERID_ARRAY });
    }

    // Search both User and Admin models
    const users = await User.find({ _id: { $in: userIds } }, "fname lname");
    const admins = await Admin.find({ _id: { $in: userIds } }, "fname lname");

    // Combine users and admins
    const allUsers = [...users, ...admins];

    // Convert to a map for easy lookup
    const userMap = allUsers.reduce((map, user) => {
      map[user._id] = `${user.fname} ${user.lname || ""}`.trim();
      return map;
    }, {});

    res.json(userMap);
  } catch (error) {
    console.error(UserMessages.ERROR_FETCHING_USERNAME, error);
    res.status(500).json({ message: CommonMessages.SERVER_ERROR });
  }
};


export const getUserById = async (userId) => {
  try {
    // Pehle User model me search karo
    let user = await User.findById(userId);
    
    // Agar User model me nahi mila, to Admin model me search karo
    if (!user) {
      user = await Admin.findById(userId);
    }

    return user || null; // Agar dono me nahi mila to null return karo
  } catch (error) {
    console.error(UserMessages.ERROR_FETCHING_USER_ID, error);
    return null;
  }
};



/**
 * Asynchronous function for getting all Users.
 *
 * @async
 * @param {Object} req - Request object with user's role and company Id. Also, contains query params for page and limit of result, search string for email matching.
 * @param {Object} res - Response object for sending back all the users.
 * @throws Will throw an error if it fails to retrieve users due to internal server error.
 *
 * @typedef {Object} UsersResponse
 * @property {Array} user - List of users fetched from the database.
 * @property {number} nbhits - Total count of users.
 * @property {number} page - Current page number.
 *
 * @returns {UsersResponse} List of users with pagination details.
 */
export const getAllUsers = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const { workspaceName } = req.query; // Get workspace name from query params

    if (!workspaceName) {
      return res.status(400).json({ message: UserMessages.WORKSPACENAME_REQ });
    }

    // Find users in the workspace
    const users = await User.find({ workspaceName: { $in: [workspaceName] } })
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Fetch super admin for the workspace
    const superAdmin = await Admin.findOne({ workspaceName: { $in: [workspaceName] } });

    // Combine superadmin with users in the workspace
    const combinedUsers = superAdmin ? [superAdmin, ...users] : users;

    res.status(StatusCodes.OK).json({
      message: UserMessages.USER_FETCHED_SUCC,
      users: combinedUsers,
      nbhits: combinedUsers.length,
      page,
    });
  } catch (error) {
    console.error("Error fetching users in workspace:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: UserMessages.INTERNAL_SERV_ERR,
    });
  }
};

export const fetchAllUsers = async (req, res) => {
  try {
    const { workspaceName } = req.query; // Get workspaceName from query params

    if (!workspaceName) {
      return res.status(400).json({ message: UserMessages.WORKSPACENAME_REQ });
    }

    // Find all users in the workspace
    const users = await User.find({ workspaceName: { $in: [workspaceName] } })
      .select("-password")
      .sort({ createdAt: -1 });

    // Fetch super admin for the workspace
    const superAdmin = await Admin.findOne({ workspaceName: { $in: [workspaceName] } });

    // Combine superadmin with workspace users
    const combinedUsers = superAdmin ? [superAdmin, ...users] : users;

    res.status(StatusCodes.OK).json({
      message: UserMessages.USER_FETCHED_SUCC,
      users: combinedUsers,
      totalCount: combinedUsers.length,
    });
  } catch (error) {
    console.error("Error fetching all users in workspace:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: UserMessages.INTERNAL_SERV_ERR,
    });
  }
};

export const adminUpdateUser = async (req, res) => {
  const { id } = req.params;
  let updatedData = { ...req.body };

  // Sanitize manager fields: set to null if missing, empty, or 'null'
  ["directManager", "dottedLineManager"].forEach((field) => {
    if (
      updatedData[field] === undefined ||
      updatedData[field] === null ||
      updatedData[field] === "" ||
      updatedData[field] === "null"
    ) {
      updatedData[field] = null;
    }
  });

  try {
    // Handle file upload (user icon) if present
    if (req.file) {
      const mimeType = req.file.mimetype;
      if (!["image/png", "image/jpeg"].includes(mimeType)) {
        return res.status(400).json({ msg: UserMessages.INVALID_FILE_TYPE });
      }
      const logoBase64 = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;
      updatedData.userLogo = logoBase64;
    }

    // First, try to find the user in the User model
    let user = await User.findByIdAndUpdate(id, updatedData, { new: true });
    let isAdmin = false;

    // If the user is not found in User model, check the Admin model (superadmin)
    if (!user) {
      user = await Admin.findByIdAndUpdate(id, updatedData, { new: true });
      isAdmin = true; // Mark as an admin if found in Admin model
    }

    if (!user) {
      return res.status(404).json({ message: UserMessages.USER_NOT_FOUND });
    }

    // Add job role to CompanyRole table if it doesn't exist
    if (updatedData.jobRole && updatedData.companyId) {
      await addJobRoleToCompany(updatedData.companyId, updatedData.jobRole);
    }

    // Add role to RoleAccess table if it doesn't exist
    if (updatedData.role && updatedData.companyId) {
      await addRoleToAccessMatrix(updatedData.companyId, updatedData.role);
    }

    // Return the updated user (either a regular user or an admin)
    res.json({ 
      message: isAdmin ? 'Superadmin updated successfully' : 'User updated successfully', 
      updatedUser: user 
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: UserMessages.ERROR_UPDATING_USER, error: error.message });
  }
};

export const getAllUsersFromWorkspaces = async (req, res) => {
  try {
    const { email } = req.params;
    console.log("email received from frontend ", email);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Fetch users and admin from workspaces
    const { users, admin } = await getUsersFromWorkspaces(email);

    // Function to format user data
    const formatUserWithBadges = ({ fname, lname, email,teamTitle, branch, role, workspaceName, assignedBadges }) => ({
      fname,
      lname,
      email,
      teamTitle,
      branch,
      role,
      workspaceName,
      assignedBadges: assignedBadges.map(({ badgeName, badgeType, badgeIcon, badgeDescription, assignedBy, assignedTo, assignedAt, visibility }) => ({
        badgeName,
        badgeType,
        badgeIcon,
        badgeDescription,
        assignedBy,
        assignedTo,
        assignedAt,
        visibility,
      })),
    });

    // Filter and format users
    const filteredUsers = users.map(formatUserWithBadges);

    // Filter and format admin
    const filteredAdmin = admin ? formatUserWithBadges(admin) : null;
    res.status(200).json({ users: filteredUsers, admin: filteredAdmin });
  } catch (error) {
    console.error("Error fetching users from workspaces:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}; 


export const getUserByKey = async (req, res) => {
  try {
    const { key } = req.params;

    if (!mongoose.Types.ObjectId.isValid(key)) {
      return res.status(400).json({ message: "Invalid ObjectId format" });
    }

    const objectId = new mongoose.Types.ObjectId(key);

    let user = await User.findById(objectId);
    if (!user) user = await Admin.findById(objectId);

    if (!user) {
      return res.status(404).json({ message: "User not found in User or Admin collection" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const importUsersProfileInfo = async (req, res) => {
  try {
    const { columns, data, month, overwrite = false } = req.body;





    if (!month || typeof month !== "string") {
      return res.status(400).json({ message: "Month is required" });
    }

    if (!Array.isArray(columns) || !Array.isArray(data)) {
      return res.status(400).json({ message: "Invalid or missing columns or data" });
    }

    if (data.length === 0) {
      return res.status(200).json({ message: "No data provided, but request accepted." });
    }

    for (const row of data) {
      const filteredRow = {};

      columns.forEach((col) => {
        filteredRow[col] = row[col] ?? "";
      });

      if (!filteredRow.employeeId) continue;

      // Normalize employeeId (remove spaces)
      const cleanEmployeeId = filteredRow.employeeId.replace(/\s/g, "");
      filteredRow.employeeId = cleanEmployeeId;

      // Use incoming `month` from frontend, ignore what's in row.monthAndYear
      filteredRow.monthAndYear = month;

      const existingRecord = await ImportedUserProfile.findOne({
        employeeId: cleanEmployeeId,
        monthAndYear: { $regex: new RegExp(`^${month}$`, "i") }, // case-insensitive match
      });

      if (existingRecord) {
        await ImportedUserProfile.updateOne(
          { _id: existingRecord._id },
          { $set: filteredRow }
        );
      } else {
        await ImportedUserProfile.create(filteredRow);
      }
    }

    return res.status(200).json({ message: "Users imported/updated successfully" });
  } catch (error) {
    console.error("Import Error:", error.message);
    return res.status(500).json({ message: "Failed to import users", error: error.message });
  }
};

// controllers/importController.js
export const getAllImportedUsers = async (req, res) => {
  try {
    const users = await ImportedUserProfile.find().lean();
    return res.status(200).json(users);
  } catch (error) {
    console.error("Fetch Error:", error.message);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};





export const getUserByEmail = async (req, res) => {
  const { email } = req.params;

  try {
    // First check in User model
    let user = await User.findOne({ email });
    let isAdmin = false;

    // If not found, check in Admin model
    if (!user) {
      user = await Admin.findOne({ email });
      if (user) isAdmin = true;
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
      message: isAdmin ? 'Superadmin found' : 'User found',
      user 
    });
  } catch (err) {
    console.error('Error fetching user by email:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
