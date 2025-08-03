import Action from "../models/Action-model.js";
import Comment from "../models/Comment-model.js";
import { ActionMessages,CommonMessages } from "../constants/enums.js";
import Notification from "../models/notifications-model.js";
import { notifyUsersForSubAssigned } from "./notification.service.js";
import { generateFileURL } from "../utils/fileutils.js";
import sendEmail from "../utils/sendEmail.js";
import User from "../models/user-model.js";
import Admin from "../models/SuperAdmin-model.js";
import config from "../config.js";

export const createActionService = async (data, files) => {
  try {
    const { actionTitle, description, userAssigned, workspaceName, userAssignedName, CreatedBy, CreatedByName, CreatedByRole, stream, subStreams, status,
          expectedCompletionDate, priority, initialComment } = data;

    if (!workspaceName) {
      throw new Error(ActionMessages.WORKSPACE_NAME);
    }

    let finalSubStreams = Array.isArray(subStreams) ? subStreams : [];
    let filePaths = files?.length > 0 ? files.map(file => file.path) : [];

    const action = new Action({
      actionTitle,
      description,
      userAssigned,
      workspaceName,
      CreatedByName,
      userAssignedName,
      CreatedBy,
      stream,
      subStreams: finalSubStreams,
      status: status || "Pending",
      priority,
      files: filePaths,
      createdDate: Date.now(),
      expectedCompletionDate,
    });

    await action.save();

    // Save Initial Comment
    if (initialComment && initialComment.trim() !== "") {
      const createdByModel = CreatedByRole === "superadmin" ? "Admin" : "User";

      const comment = new Comment({
        actionId: action._id,
        workspaceName,
        description: initialComment,
        createdBy: CreatedBy,
        createdByName: CreatedByName,
        createdByModel,
        parentComment: null,
      });

      await comment.save();
    }

    // Try to find assigned user in User collection
    let assignedUser = await User.findById(userAssigned).select('email');

    // If not found in User, try Admin collection
    if (!assignedUser) {
      assignedUser = await Admin.findById(userAssigned).select('email');
    }

    if (assignedUser && assignedUser.email) {
      const emailOptions = {
        email: assignedUser.email,
        subject: `New Task Assigned: ${actionTitle}`,
        html: `
          <p>Hello ${userAssignedName || ''},</p>
          <p>You have been assigned a new task titled "<strong>${actionTitle}</strong>".</p>
          <p><strong>Description:</strong> ${description || 'No description provided.'}</p>
          <p><strong>Expected Completion Date:</strong> ${expectedCompletionDate ? new Date(expectedCompletionDate).toLocaleDateString() : 'N/A'}</p>
          <p>Please check your task dashboard for more details.</p>
           <p>
            <a href="${config.CLIENT_URL}" style="
              display: inline-block;
              padding: 10px 20px;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            ">Go to Task Dashboard</a>
          </p>
          <br />
          <p>Regards,<br/>${CreatedByName || 'Task Management System'}</p>
        `
      };

      await sendEmail(emailOptions);
    } else {
      console.warn(`No email found for assigned user/admin with ID ${userAssigned}`);
    }


    return { message: ActionMessages.ACTION_CREATED, action };
  } catch (error) {
    console.error(ActionMessages.ACTION_CREATE_ERR, error);
    throw new Error(ActionMessages.SERVER_ERR);
  }
};

export const removeUserFromActionService = async (id, userId) => {
    try {
      // Remove user from the action
      const updatedAction = await Action.findByIdAndUpdate(
        id,
        { $pull: { subAssigned: userId } },
        { new: true }
      );
  
      if (!updatedAction) {
        throw new Error(ActionMessages.NOT_FOUND);
      }
  
      // Remove associated notifications
      await Notification.deleteMany({ actionId: id, userId });
  
      return { message: ActionMessages.SUCCESS_REMOVED, action: updatedAction };
    } catch (error) {
      console.error(ActionMessages.REMOVE_ERROR, error);
      throw new Error(ActionMessages.REMOVE_ERROR);
    }
  };
  

  export const updateActionStatusService = async (id, status) => {
    try {
      const updatedAction = await Action.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
  
      if (!updatedAction) {
        throw new Error(ActionMessages.ACTION_NOT_FOUND);
      }
  
      return { message: ActionMessages.STATUS_UPDATED, action: updatedAction };
    } catch (error) {
      console.error(ActionMessages.ERROR_UPDATE_STATUS, error);
      throw new Error(CommonMessages.INTERNAL_SERVER_ERROR);
    }
  };


  export const updateActionTextService = async (id, description) => {
    try {
      const updatedActionText = await Action.findByIdAndUpdate(
        id,
        { description },
        { new: true }
      );
  
      if (!updatedActionText) {
        throw new Error(ActionMessages.ACTION_NOT_FOUND);
      }
  
      return { message: ActionMessages.DESCRIPTION_UPDATE, action: updatedActionText };
    } catch (error) {
      console.error(ActionMessages.ERROR_UPDATE_DESCRIPTION, error);
      throw new Error(CommonMessages.INTERNAL_SERVER_ERROR);
    }
  };
  

  export const getActionsService = async (loggedUserId) => {
    try {
      // Ensure loggedUserId is a valid ObjectId
      if (!loggedUserId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error(ActionMessages.INVALID_USER_FORMAT);
      }
  
      const actions = await Action.find({
        $or: [
          { userAssigned: loggedUserId },
          { CreatedBy: loggedUserId },
        ]
      });
  
      return actions;
    } catch (error) {
      console.error(ActionMessages.ERROR_GETTING_ACTION, error);
      throw new Error(ActionMessages.INTERNAL_SERVER_ERROR);
    }
  };


  export const getActionByIdService = async (id) => {
    try {
      const action = await Action.findById(id);
      if (!action) throw new Error(ActionMessages.ACTION_NOT_FOUND);
      return action;
    } catch (error) {
      console.error(CommonMessages.SERVER_ERROR, error);
      throw new Error(CommonMessages.SERVER_ERROR);
    }
  };

  export const addUserToActionService = async (actionId, userId) => {
    try {
      if (!userId) throw new Error(ActionMessages.USER_ID_REQUIRED);
  
      const action = await Action.findByIdAndUpdate(
        actionId,
        { $addToSet: { subAssigned: userId } }, 
        { new: true }
      );
  
      if (!action) throw new Error(ActionMessages.ACTION_NOT_FOUND);
  
      // Notify the newly added user
      await notifyUsersForSubAssigned(actionId, userId);
  
      return action;
    } catch (error) {
      console.error(ActionMessages.ERROR_ADDING_ACTION, error);
      throw new Error(CommonMessages.INTERNAL_SERVER_ERROR);
    }
  };


  export const fetchActionById = async (actionId) => {
    return await Action.findById(actionId).populate("subAssigned");
  };
  

  export const getFilesForActionService = async (actionId, req) => {
    const action = await Action.findById(actionId);
    if (!action) return null;
  
    if (!action.files || action.files.length === 0) return [];
  
    return action.files.map((filePath) => {
      const fileName = filePath.split("/").pop();
      return {
        name: fileName,
        url : generateFileURL(req, fileName),
      };
    });
  };

// url: `${req.protocol}://${req.get("host")}/uploads/${fileName}`,

export const updateAssignedUserService = async (actionId, newUserId) => {
    const action = await Action.findById(actionId);
    if (!action) return { error: ActionMessages.ACTION_NOT_FOUND };

    // Old assigned user
    const oldAssignedUser = action.userAssigned;

    // Remove action from old user's list
    let oldUser = await User.findById(oldAssignedUser) || await Admin.findById(oldAssignedUser);
    if (oldUser) {
        await oldUser.updateOne({ $pull: { actions: actionId } });
    }

    // Find new user in User/Admin collections
    let newUser = await User.findById(newUserId) || await Admin.findById(newUserId);
    if (!newUser) return { error: ActionMessages.NEW_ASSIGNED_USER };

    // Update action
    action.userAssigned = newUserId;
    action.userAssignedName = `${newUser.fname} ${newUser.lname}`;
    await action.save();

    // Add action to new user's list
    await newUser.updateOne({ $push: { actions: actionId } });

    // Send email notification
    if (newUser.email) {
        const emailSubject = `Task Reassigned: ${action.actionTitle}`;
        const htmlMessage = `
            <p>Hello <strong>${newUser.fname} ${newUser.lname}</strong>,</p>
            <p>A task has been reassigned to you.</p>
            <ul>
                <li><strong>Title:</strong> ${action.actionTitle}</li>
                <li><strong>Priority:</strong> ${action.priority}</li>
            </ul>
            <p>Assigned by: <strong>${action.CreatedByName}</strong></p>   
             <p>
            <a href="${config.CLIENT_URL}" style="
              display: inline-block;
              padding: 10px 20px;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            ">Go to Task Dashboard</a>
          </p>
            <p>Best Regards,<br>ReTeam</p>
        `;

        await sendEmail({
            email: newUser.email,
            subject: emailSubject,
            html: htmlMessage,
        });
    } else {
        console.warn(ActionMessages.NEW_ASSIGNED_USER_WARN);
    }

    return { message: ActionMessages.ASSIGNER_USER_UPDATE_SUCC };
};


export const uploadFilesService = async (actionId, files) => {
    const action = await Action.findById(actionId);
    if (!action) return { error: ActionMessages.NOT_FOUND };

    // Add uploaded file paths to the `files` array
    // const filePaths = files.map((file) => `${file.filename}`);
    const filePaths = files.map((file) => file.path.replace(/\\/g, "/"))
    action.files.push(...filePaths);
    // Save the updated action
    await action.save();

    return { message: ActionMessages.FILES_UPLOADED, files: action.files };
};


  