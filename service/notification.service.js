import mongoose from "mongoose";
import Action from "../models/Action-model.js";
import Notification from "../models/notifications-model.js";
import Teams from "../models/team-model.js";
import User from "../models/user-model.js";
import { io } from "../app.js"; 
import { NotificationMessages, NotifyuserMessages } from "../constants/enums.js";

/**
 * Helper to create and save notifications, then emit WebSocket events
 */
const createNotificationAndEmit = async (userIds, action, eventType) => {
  if (!userIds.length) return;

  // Save notifications
  await Promise.all(
    userIds.map((userId) =>
      new Notification({
        userId,
        actionId: action._id,
        actionTitle: action.actionTitle,
        description: action.description,
        CreatedByName: action.CreatedByName,
        CreatedBy: action.CreatedBy,
        userAssigned: action.userAssigned,
        userAssignedName: action.userAssignedName,
        subAssigned: action.subAssigned,
      }).save()
    )
  );

  // Emit real-time notifications via WebSocket
  userIds.forEach((userId) => {
    io.to(userId.toString()).emit(eventType, {
      actionId: action._id.toString(),
      actionTitle: action.actionTitle,
      description: action.description,
      CreatedByName: action.CreatedByName,
      CreatedBy: action.CreatedBy,
      userAssigned: action.userAssigned,
      userAssignedName: action.userAssignedName,
      subAssigned: action.subAssigned,
    });
  });
};

/**
 * Create survey-related notifications
 */
const createSurveyNotificationAndEmit = async (userIds, notificationData, eventType) => {
  if (!userIds.length) return;

  // Create notifications for survey events
  await Promise.all(
    userIds.map((userId) =>
      new Notification({
        userId,
        actionId: notificationData.surveyId || new mongoose.Types.ObjectId(), // Use survey ID or generate new one
        actionTitle: notificationData.title,
        description: notificationData.description,
        CreatedByName: notificationData.createdByName,
        CreatedBy: notificationData.createdBy,
        userAssigned: userId.toString(),
        userAssignedName: notificationData.userAssignedName || "User",
        subAssigned: [],
        notificationType: notificationData.type || 'survey', // Add notification type
        surveyId: notificationData.surveyId, // Store survey ID for reference
      }).save()
    )
  );

  // Emit real-time notifications via WebSocket
  userIds.forEach((userId) => {
    io.to(userId.toString()).emit(eventType, {
      surveyId: notificationData.surveyId,
      title: notificationData.title,
      description: notificationData.description,
      createdByName: notificationData.createdByName,
      type: notificationData.type,
      timestamp: new Date(),
    });
  });
};

export const notifyUsersService = async (actionId) => {
  try {
    // Retrieve the action data by its ID
    const action = await Action.findById(actionId);
    if (!action) throw new Error(NotifyuserMessages.ACTION_NOT_FOUND);

    // Check if the stream is 'Personal_Stream' and handle notification accordingly
    if (action.stream === "Personal_Stream") {
      // Send notification only to the CreatedBy and userAssigned
      const userIdsToNotify = [action.CreatedBy, action.userAssigned];
      
      // Use the helper function to create and emit notifications
      await createNotificationAndEmit(userIdsToNotify, action, "newAction");

      return { success: true, message: NotifyuserMessages.USER_NOTIFIED_SUCCESSFULLY, notifiedUsers: userIdsToNotify };
    }

    // If the stream is not 'Personal_Stream', proceed with the original logic (notifying all associated teams)
    const teams = await Action.findAssociatedTeams(
      action.workspaceName,
      action.stream,
      action.subStreams
    );

    if (!teams.length) {
      // If no teams are associated, return success with no users notified
      return { success: true, message: NotifyuserMessages.NO_TEAM_ASSOCIATES, notifiedUsers: [] };
    }

    const teamTitles = teams.map((team) => team.teamTitle);
    const teamUsers = await Teams.findUsersInTeams(teamTitles, action.workspaceName);
    const allUserIds = Array.from(new Set(teamUsers.map((user) => user._id)));

    // Send notifications to all users in the associated teams
    await createNotificationAndEmit(allUserIds, action, "newAction");

    return { success: true, message: NotifyuserMessages.USER_NOTIFIED_SUCCESSFULLY, notifiedUsers: allUserIds };
  } catch (error) {
    console.error("Error in notifyUsersService:", error);
    throw new Error(error.message);
  }
};

export const notifyUsersForSubAssigned = async (actionId, userId) => {
  try {
    const action = await Action.findById(actionId);
    if (!action) return;

    // Use helper function (single user)
    await createNotificationAndEmit([userId], action, "newSubAssignedAction");

  } catch (error) {
    console.error("Error notifying user for sub-assigned action:", error);
  }
};


/**
 * Fetch notifications for a user
 */
export const getNotificationsService = async (userId) => {
  if (!userId) {
    throw new Error(NotificationMessages.USERID_REQUIRED);
  }

  try {
    return await Notification.find({ userId }).sort({ createdAt: -1 });
  } catch (error) {
    console.error(NotificationMessages.ERROR_FETCHING_NOTIFICATION, error);
    throw new Error(NotificationMessages.ERROR_FETCHING_NOTIFICATION);
  }
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsReadService = async (id) => {
  try {
    const updated = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    if (!updated) {
      throw new Error(NotificationMessages.NOTIFICATION_NOT_FOUND);
    }
    return updated;
  } catch (error) {
    console.error(NotificationMessages.ERROR_MARKING_NOTIFICATION, error);
    throw new Error(NotificationMessages.ERROR_MARKING_NOTIFICATION);
  }
};

/**
 * Delete a notification
 */
export const deleteNotificationService = async (id) => {
  try {
    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) {
      throw new Error(NotificationMessages.NOTIFICATION_NOT_FOUND);
    }
    return true;
  } catch (error) {
    console.error(NotificationMessages.ERROR_DELETING_NOTIFICATION, error);
    throw new Error(NotificationMessages.ERROR_DELETING_NOTIFICATION);
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsReadService = async (userId) => {
  if (!userId) {
    throw new Error(NotificationMessages.USERID_REQUIRED);
  }

  try {
    return await Notification.updateMany({ userId, read: false }, { read: true });
  } catch (error) {
    console.error(NotificationMessages.ERROR_MARKING_NOTIFICATION, error);
    throw new Error(NotificationMessages.ERROR_MARKING_NOTIFICATION);
  }
};

/**
 * 🆕 Notify users when a new survey is launched
 */
export const notifyUsersAboutSurveyLaunch = async (surveyData, workspaceName, createdByName, createdById) => {
  try {
    console.log('🔔 Creating survey launch notifications...');
    
    // Get all users in the workspace (excluding the creator)
    const users = await User.find({ 
      workspace: workspaceName,
      _id: { $ne: createdById } // Exclude the survey creator
    }).select('_id firstName lastName');
    
    if (!users.length) {
      console.log('No users found in workspace to notify');
      return;
    }

    const userIds = users.map(user => user._id);
    
    const notificationData = {
      surveyId: surveyData.sid,
      title: `📊 New Survey: ${surveyData.survey.title}`,
      description: `A new survey "${surveyData.survey.title}" has been launched in your workspace. Click to participate!`,
      createdByName: createdByName,
      createdBy: createdById,
      type: 'survey_launch'
    };

    // Use the survey notification helper
    await createSurveyNotificationAndEmit(userIds, notificationData, 'new_survey');
    
    console.log(`✅ Survey launch notifications sent to ${userIds.length} users`);
  } catch (error) {
    console.error('❌ Error sending survey launch notifications:', error);
  }
};

/**
 * 🆕 Notify user when admin replies to their survey comment
 */
export const notifyUserAboutCommentReply = async (surveyId, questionId, originalCommentUserId, adminReply, adminName) => {
  try {
    console.log('🔔 Creating comment reply notification...');
    
    // Don't notify if the admin is replying to their own comment
    if (originalCommentUserId === adminReply.createdBy) {
      return;
    }
    
    // Get the user who made the original comment
    const user = await User.findById(originalCommentUserId).select('_id firstName lastName');
    if (!user) {
      console.log('Original comment user not found');
      return;
    }

    const notificationData = {
      surveyId: surveyId,
      title: `💬 Admin replied to your comment`,
      description: `${adminName} replied to your survey comment: "${adminReply.reply.substring(0, 100)}..."`,
      createdByName: adminName,
      createdBy: adminReply.createdBy,
      userAssignedName: `${user.firstName} ${user.lastName}`,
      type: 'comment_reply'
    };

    // Send notification to the original commenter
    await createSurveyNotificationAndEmit([user._id], notificationData, 'comment_reply');
    
    console.log(`✅ Comment reply notification sent to user ${user._id}`);
  } catch (error) {
    console.error('❌ Error sending comment reply notification:', error);
  }
};
