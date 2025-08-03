import Badge from "../models/Badge-model.js";
import Workspace from "../models/workspace-model.js";
import Admin from "../models/SuperAdmin-model.js";
import User from "../models/user-model.js";
import AssignedBadge from "../models/AssignedBadge-Model.js";
import { BadgeMessages } from "../constants/enums.js";
import mongoose from 'mongoose';
import sendEmail from "../utils/sendEmail.js";
import config from "../config.js";

/**
 * Fetch assigned badges based on visibility type.
 */
export const getAssignedBadges = async (filter) => {
    const assignedBadges = await AssignedBadge.find(filter).sort({ assigned_at: -1 });

    return await Promise.all(
        assignedBadges.map(async (badge) => {
            try {
                let assignedBy = "Unknown";
                let assignedTo = "Unknown";

                // Fetch assigned_by details
                if (badge.assigned_by && mongoose.Types.ObjectId.isValid(badge.assigned_by.toString())) {
                    let user = await User.findById(badge.assigned_by).select("fname lname userLogo").lean();
                    let admin = await Admin.findById(badge.assigned_by).select("fname lname userLogo").lean();

                    assignedBy = user 
  ? { name: `${user.fname} ${user.lname}`, userLogo: user.userLogo }
  : admin 
    ? { name: `${admin.fname} ${admin.lname}`, userLogo: admin.userLogo }
    : { name: "Unknown", userLogo: "" };

                    // assignedBy = user ? `${user.fname} ${user.lname}` : admin ? `${admin.fname} ${admin.lname}` : "Unknown";
                }

                // Fetch assigned_to details
                if (badge.assigned_to && mongoose.Types.ObjectId.isValid(badge.assigned_to.toString())) {
                    let userTo = await User.findById(badge.assigned_to).select("fname lname").lean();
                    let adminTo = await Admin.findById(badge.assigned_to).select("fname lname").lean();

                    assignedTo = userTo 
  ? { name: `${userTo.fname} ${userTo.lname}`, userLogo: userTo.userLogo }
  : adminTo 
    ? { name: `${adminTo.fname} ${adminTo.lname}`, userLogo: adminTo.userLogo }
    : { name: "Unknown", userLogo: "" };

                    // assignedTo = userTo ? `${userTo.fname} ${userTo.lname}` : adminTo ? `${adminTo.fname} ${adminTo.lname}` : "Unknown";
                } else {
                    console.warn(`Invalid ObjectId for assigned_to: ${badge.assigned_to}`);
                }

                // Fetch badge details
                let badgeDetails = { name: "Unknown Badge", type: "Unknown Type", icon: "" };
                if (badge.badge && mongoose.Types.ObjectId.isValid(badge.badge.toString())) {
                    const fetchedBadge = await Badge.findById(badge.badge).select("name type icon").lean();
                    if (fetchedBadge) {
                        badgeDetails = {
                            name: fetchedBadge.name,
                            type: fetchedBadge.type,
                            icon: fetchedBadge.icon || "",
                        };
                    }
                }

                return {
                    _id: badge._id,
                    badge: badgeDetails,
                    assignedBy,
                    assignedTo,
                    description: badge.description,
                    assigned_at: badge.assigned_at,
                };
            } catch (err) {
                console.error("Error processing badge:", err);
                return null;
            }
        })
    );
};

/**
 * Get the workspace names based on scope
 */
export const getWorkspaceNames = async (loggedInUserId, workspaceScope, selectedWorkspace) => {
    if (!loggedInUserId) {
        throw new Error(BadgeMessages.UNAUTHORIZED_NO_USER);
    }

    let workspaceNames = [];

    if (workspaceScope === "all") {
        const userWorkspaces = await Workspace.find({ "createdBy.adminId": loggedInUserId });

        if (!userWorkspaces.length) {
            throw new Error(BadgeMessages.NO_WORKSPACE_FOUND);
        }

        workspaceNames = userWorkspaces.map(workspace => workspace.workspacename);
    } else if (workspaceScope === "specific") {
        if (!selectedWorkspace) {
            throw new Error(BadgeMessages.SELECTED_WORKSPACE_REQUIRED_FOR_SPECIFIC_SCOPE);
        }

        const workspace = await Workspace.findById(selectedWorkspace);
        if (!workspace) {
            throw new Error(BadgeMessages.SELECTED_WORKSPACE_REQUIRED_FOR_SPECIFIC_SCOPE);
        }

        workspaceNames = [workspace.workspacename];
    } else {
        throw new Error(BadgeMessages.INVALID_WORKSPACE_SCOPE);
    }

    return workspaceNames;
};

/**
 * Get user email (checks in both Admin & User collections)
 */
export const getUserEmail = async (loggedInUserId) => {
    const adminUser = await Admin.findById(loggedInUserId);
    if (adminUser) return adminUser.email;

    const normalUser = await User.findById(loggedInUserId);
    if (normalUser) return normalUser.email;

    throw new Error(BadgeMessages.USER_EMAIL_NOT_FOUND);
};

/**
 * Create a new badge
 */
export const createBadgeService = async (loggedInUserId, { name, type, icon, workspaceScope, selectedWorkspace }) => {
    if (!name || !type || !icon || !workspaceScope) {
        throw new Error(BadgeMessages.MISSING_REQUIREDd_FIELDS);
    }

    const workspaceNames = await getWorkspaceNames(loggedInUserId, workspaceScope, selectedWorkspace);
    const userEmail = await getUserEmail(loggedInUserId);

    const newBadge = new Badge({ name, type, icon, workspaceNames, createdBy: userEmail });
    await newBadge.save();

    return newBadge;
};

/**
 * Get all badges for a workspace
 */
export const getAllBadgesService = async (workspacename) => {
    if (!workspacename) {
        throw new Error(BadgeMessages.WORKSPACENAME_IS_REQUIRED);
    }

    return await Badge.find({ workspaceNames: { $in: [workspacename] } });
};


/**
 * Get all badges created by the logged-in superadmin
 */
export const getAllSuperadminBadgesService = async (userEmail) => {
    return await Badge.find({ createdBy: userEmail });
};

export const assignBadgeService = async ({ badge, assigned_by, assigned_to, description, visibility, team, workspacename }) => {
    // Check if the badge exists
    const existingBadge = await Badge.findById(badge);
    if (!existingBadge) {
        throw new Error(BadgeMessages.BADGE_NOT_FOUND);
    }

    // Validate visibility
    const validVisibilityOptions = ['in_person', 'in_team', 'public'];
    if (!validVisibilityOptions.includes(visibility)) {
        throw new Error(BadgeMessages.INVALID_VISIBLITY_OPTION);
    }

    // Ensure team is assigned properly when visibility is "in_team"
    if (visibility === "in_team" && !team) {
        throw new Error("Team must be provided for in_team visibility");
    }

    // Create and save assigned badge
    const newAssignedBadge = new AssignedBadge({
        badge,
        assigned_by,
        assigned_to: assigned_to || null,
        team: visibility === "in_team" ? team : null,
        description,
        workspacename,
        visibility
    });

    await newAssignedBadge.save();

    // Function to find a user in both User and Admin collections
    const findUserOrAdmin = async (id) => {
        let user = await User.findById(id);
        if (!user) {
            user = await Admin.findById(id); // Check in Admin if not found in User
        }
        return user;
    };

    // Fetch user details from either User or Admin collections
    const assignedToUser = await findUserOrAdmin(assigned_to);
    const assignedByUser = await findUserOrAdmin(assigned_by);

    if (assignedToUser && assignedByUser) {
        const recipientEmail = assignedToUser.email;
        const assignerName = `${assignedByUser.fname} ${assignedByUser.lname}`;
        const badgeType = existingBadge.type; // Assuming badge model has a "type" field: "praise" or "concern"

        // Prepare email content
        const emailSubject = badgeType === "praise"
            ? "🎉 You've Received a Praise Badge!"
            : "⚠️ You've Received a Concern Badge";

        const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="text-align: center; color: ${badgeType === "praise" ? "#28a745" : "#d9534f"};">
                ${badgeType === "praise" ? "🎉 Congratulations!" : "⚠️ Attention Required"}
            </h2>
            <p style="font-size: 16px;">
                Hello <strong>${assignedToUser.fname}</strong>,<br><br>
                ${badgeType === "praise"
                    ? `You have been awarded a <strong>Praise</strong> badge by <strong>${assignerName}</strong> for your outstanding contributions. Keep up the great work! 🌟`
                    : `You have received a <strong>Concern</strong> badge from <strong>${assignerName}</strong>. This is to bring attention to an area for improvement. Please take it constructively and reach out for any support.`}
            </p>
            <p style="font-size: 14px; color: #555;">
                <strong>Description:</strong> ${description}
            </p>
            <p style="font-size: 14px; color: #555;">
                <strong>Workspace:</strong> ${workspacename}
            </p>
             <p style="text-align: center; margin-top: 30px;">
                <a href="${config.CLIENT_URL}" style="
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: ${badgeType === "praise" ? "#28a745" : "#d9534f"};
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                ">View in Dashboard</a>
                </p>
            <hr>
            <p style="font-size: 12px; text-align: center; color: #999;">
                This is an automated email from <strong>YourApp</strong>. Please do not reply.
            </p>
        </div>`;

        // Send email
        await sendEmail({
            email: recipientEmail,
            subject: emailSubject,
            html: emailHtml
        });
    }

    return newAssignedBadge;
};


export const deleteBadgeById = async (id) => {
    return await Badge.findByIdAndDelete(id);
};

export const getUserBadgesById = async (userId) => {
    if (!userId) throw new Error(BadgeMessages.USER_ID_IS_REQUIRED);
  
    const userBadges = await AssignedBadge.find({ assigned_to: userId })
      .populate("badge")
      .lean();
  
    if (!userBadges.length) return [];
  
    const assignedByIds = userBadges.map(entry => entry.assigned_by);
  
    const [users, admins] = await Promise.all([
      User.find({ _id: { $in: assignedByIds } }).select("email fname lname userLogo").lean(),
      Admin.find({ _id: { $in: assignedByIds } }).select("email fname lname userLogo").lean()
    ]);
  
    // Map all assigners (users + admins) by ID
    const assignerMap = {};
    users.forEach(u => { assignerMap[u._id.toString()] = u; });
    admins.forEach(a => { assignerMap[a._id.toString()] = a; });
  
    return userBadges
      .filter(entry => entry.badge)
      .map(entry => {
        const assigner = assignerMap[entry.assigned_by.toString()] || {};
  
        return {
          id: entry.badge._id,
          name: entry.badge.name,
          description: entry.description || entry.badge.description,
          assigned_at: entry.assigned_at,
          visibility: entry.visibility,
          icon: entry.badge.icon,
          type: entry.badge.type,
          assigned_by_email: assigner.email || "N/A",
          assigned_by_fname: assigner.fname || "",
          assigned_by_lname: assigner.lname || "",
          assigned_by_userLogo: assigner.userLogo || null,
        };
      });
  };
  