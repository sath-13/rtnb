import User from "../models/user-model.js";
import Admin from "../models/SuperAdmin-model.js";
import Workspace from "../models/workspace-model.js";
import AssignedBadge from "../models/AssignedBadge-Model.js";

export const getUsersFromWorkspaces = async (email) => {
  try {
    // Find the admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      throw new Error("Admin not found");
    }

    // Get workspaces created by this admin
    const workspaces = await Workspace.find({ "createdBy.adminId": admin._id });
    const workspaceNames = workspaces.map((ws) => ws.workspacename);

    if (workspaceNames.length === 0) {
      return { users: [], admin };
    }

    // Find users who belong to these workspaces
    const users = await User.find({ workspaceName: { $in: workspaceNames } });

    // Function to fetch user details from either Admin or User model
    const getUserDetails = async (userId) => {
      let user = await User.findById(userId).select("fname lname email teamTitle role branch");
      if (!user) {
        user = await Admin.findById(userId).select("fname lname email  teamTitle role branch");
      }
      return user
        ? {
            name: `${user.fname} ${user.lname}`,
            email: user.email,
            role: user.role,
            teamTitle:user.teamTitle,
            branch: user.branch || "N/A",
          }
        : null;
    };

    // Function to fetch assigned badges
    const getAssignedBadges = async (userId) => {
      const assignedBadges = await AssignedBadge.find({ assigned_to: userId }).populate("badge");
      return Promise.all(
        assignedBadges.map(async (badge) => {
          if (!badge.badge) return null; // Skip if badge is missing
    
          return {
            badgeName: badge.badge.name,
            badgeType: badge.badge.type,
            badgeIcon: badge.badge.icon,
            badgeDescription: badge.description,
            assignedBy: await getUserDetails(badge.assigned_by),
            assignedTo: await getUserDetails(badge.assigned_to),
            assignedAt: badge.assigned_at,
            visibility: badge.visibility,
          };
        })
      ).then((results) => results.filter(Boolean)); // Remove nulls
    };
    

    // Fetch assigned badges for each user
    const usersWithBadges = await Promise.all(
      users.map(async (user) => ({
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        teamTitle:user.teamTitle,
        branch: user.branch,
        role: user.role,
        workspaceName: user.workspaceName,
        assignedBadges: await getAssignedBadges(user._id),
      }))
    );

    // Fetch assigned badges for the admin
    const adminWithBadges = {
      fname: admin.fname,
      lname: admin.lname,
      email: admin.email,
      teamTitle:admin.teamTitle,
      branch: admin.branch || "N/A",
      role: admin.role,
      workspaceName: workspaceNames,
      assignedBadges: await getAssignedBadges(admin._id),
    };

    return { users: usersWithBadges, admin: adminWithBadges };
  } catch (error) {
    throw new Error(error.message);
  }
};



