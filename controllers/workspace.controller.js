import Workspace from "../models/workspace-model.js";
import Admin from "../models/SuperAdmin-model.js";
import User from "../models/user-model.js";
import multer from "multer";
import AssetAcknowledgement from "../models/AssetAcknowledgment-model.js";
import Teams from "../models/team-model.js";
import Action from "../models/Action-model.js";
import Comment from "../models/Comment-model.js";
import Streams from "../models/stream-model.js";
import { CommonMessages, WorkspaceMessages } from "../constants/enums.js";
import Product from "../models/product-model.js";
import Post from "../models/Post-model.js";
import AssignedBadge from "../models/AssignedBadge-Model.js";
import AssignedProduct from "../models/assignedProduct-model.js";
import Feedback from "../models/Feedback-model.js";
import FeedbackRequest from "../models/Feedback-Request-Model.js";
import InternalNode from "../models/InternalNodes-Model.js";
import StoreRequestedFeedback from "../models/RequestFeedbackSchema.js";
import SubStream from "../models/substream-model.js";

const storage = multer.memoryStorage(); // Store file in memory as buffer

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Only .png and .jpeg files are allowed!"), false); // Reject the file
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });
// const upload = multer({ storage: storage });

export const createWorkspace = async (req, res) => {``
    try {

      let { workspacename } = req.body;
    workspacename = workspacename.toLowerCase();

    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ message: WorkspaceMessages.UNAUTHORIZED_ADMIN });
    }

    if (!workspacename || workspacename.length < 4) {
      return res.status(400).json({ message: WorkspaceMessages.MIN_LENGTH });
    }

    // Check if the workspace name already exists for this admin
    const existingWorkspace = await Workspace.findOne({ workspacename, "createdBy.adminId": adminId });
    if (existingWorkspace) {
      return res.status(400).json({ message: WorkspaceMessages.WORKSPACENAME_EXISTS });
    }

    let logoBase64 = '';

        if (req.file) {
            logoBase64 = req.file.buffer.toString('base64'); // Convert buffer to Base64
        }

    const newWorkspace = new Workspace({
      workspacename,
      createdBy: { adminId },
      logo: logoBase64 ? `data:image/png;base64,${logoBase64}` : '',
    });

    await newWorkspace.save();

    await Admin.findByIdAndUpdate(adminId, { $push: { workspaceName: workspacename } });

    //Return success response
    return res.status(201).json({ message: WorkspaceMessages.WORKSPACE_CREATED_SUCCESSFULLY, workspace: newWorkspace });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: WorkspaceMessages.ERROR_CREATING_WORKSPACE , error: error.message });
  }  
};

export const checkWorkspaceName = async (req, res) => {
  try {
    const { workspacename } = req.query;

    if (!workspacename) {
      return res.status(400).json({ message: WorkspaceMessages.WORKSPACENAME_REQ });
    }

    // Convert workspace name to lowercase for case-insensitive matching
    const existingWorkspace = await Workspace.findOne({ 
      workspacename: workspacename.toLowerCase() 
    });

    if (existingWorkspace) {
      return res.json({ exists: true }); // Workspace name already exists
    }
    
    res.json({ exists: false }); // Workspace name is available
  } catch (error) {
    console.error("Error checking workspace name:", error);
    res.status(500).json({ message: WorkspaceMessages.INTERNAL_SERVER_ERROR });
  }
};

export const checkWorkspaceEditName = async (req, res) => {
  try {
    const { workspacename, workspaceId } = req.query;

    if (!workspacename) {
      return res.status(400).json({ message: WorkspaceMessages.WORKSPACENAME_REQ });
    }

    // case‑insensitive match, but ignore the record we're editing
    const filter = {
      workspacename: workspacename.toLowerCase()
    };
    if (workspaceId) {
      filter._id = { $ne: workspaceId };
    }

    const existing = await Workspace.findOne(filter);
    return res.json({ exists: !!existing });
  } catch (error) {
    console.error("Error checking workspace name:", error);
    res.status(500).json({ message: WorkspaceMessages.INTERNAL_SERVER_ERROR });
  }
};

// Update workspace logo in both Workspace and User models
export const updateWorkspaceLogo = async (req, res) => {
  try {
    const workspaceId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ message: WorkspaceMessages.NO_FILE_UPLOADED });
    }

    const mimeType = req.file.mimetype;
    if (!["image/png", "image/jpeg"].includes(mimeType)) {
      return res.status(400).json({ message: WorkspaceMessages.INVALID_FILE_TYPE });
    }

    const logoBase64 = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;

    // Find the existing workspace
    const existingWorkspace = await Workspace.findById(workspaceId);
    if (!existingWorkspace) {
      return res.status(404).json({ message: WorkspaceMessages.WORKSPACE_NOT_FOUND });
    }

    const oldWorkspaceName = existingWorkspace.workspacename; // Store old workspace name

    // Update the workspace logo in the Workspace model
    const updatedWorkspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      { logo: logoBase64 },
      { new: true }
    );

    // Update workspace logo in User model for all users assigned to this workspace
    await User.updateMany(
      { workspaceName: oldWorkspaceName }, // Find users assigned to this workspace
       { $set: { workspaceLogo: logoBase64 } }
    );

    // Update workspace logo in Admin model for all admins managing this workspace
    await Admin.updateMany(
      { workspaceName: oldWorkspaceName }, // Find admins managing this workspace
      { $set: { workspaceLogo: logoBase64 } }
    );
    

    res.status(200).json({
      message: WorkspaceMessages.WORKSPACE_LOGO_UPDATED_SUCCESSFULLY,
      workspace: updatedWorkspace,
    });
  } catch (error) {
    console.error(WorkspaceMessages.ERROR_UPDATING_WORKSPACE_LOGO, error);
    res.status(500).json({ message: CommonMessages.SERVER_ERROR, error: error.message });
  }
};



// Middleware for file upload
export const uploadLogo = upload.single("logo");


export const checkWorkspacenameAvailability = async (req, res) => {
  try {
    const { workspacename } = req.params;
    // Convert to lowercase if your database stores them in lowercase
    const workspace = await Workspace.findOne({ workspacename: workspacename.toLowerCase() });
    if (!workspace) {
      return res.status(404).json({ msg: WorkspaceMessages.WORKSPACE_NOT_FOUND });
    }
    res.status(200).json({ msg: WorkspaceMessages.WORKSPACE_EXISTS });
  } catch (err) {
    console.error(WorkspaceMessages.ERROR_CHECKING_WORKSPACE_EXISTENCE, err);
    res.status(500).json({ msg: CommonMessages.INTERNAL_SERVER_ERROR });
  }
};

export const getWorkspaceByName = async (req, res) => {
  try {
    const { workspacename } = req.params;
    const workspace = await Workspace.findOne({ workspacename });

    if (!workspace) {
      return res.status(404).json({ message: WorkspaceMessages.WORKSPACE_NOT_FOUND });
    }

    res.status(200).json({
      workspacename: workspace.workspacename,
      logo: workspace.logo, // Ensure logo is included
    });
  } catch (error) {
    console.error(WorkspaceMessages.ERROR_FETCHING_WORKSPACE , error);
    res.status(500).json({ message: CommonMessages.SERVER_ERROR });
  }
};



// Get all workspaces created by the logged-in admin.
export const getAllWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id;  // Logged-in user's ID

    // Find all workspaces where createdBy.adminId === logged-in userId
    const workspaces = await Workspace.find({ "createdBy.adminId": userId });

    res.status(200).json({ workspaces });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching workspaces", error: error.message });
  }
};




export const deleteWorkspace = async (req, res) => {
  try {
    const workspaceId = req.params.id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: WorkspaceMessages.WORKSPACE_NOT_FOUND });
    }

    // Check if the logged-in admin is the creator.
    const adminId = req.user?.id;
    if (!adminId || workspace.createdBy.adminId !== adminId) {
      return res.status(403).json({ message: WorkspaceMessages.UNAUTHORIZED_CANNOT_DELETE });
    }

    const wsName = workspace.workspacename;

    await Teams.deleteMany({ workspaceName: wsName });

    await User.deleteMany({ workspaceName: wsName });

    await Comment.deleteMany({ workspaceName: wsName });

    await Streams.deleteMany({ workspaceName: wsName });

    await Action.deleteMany({ workspaceName: wsName });

    await Admin.updateMany({ workspaceName: wsName }, { $pull: { workspaceName: wsName } });

    await Workspace.findByIdAndDelete(workspaceId);


    res.status(200).json({ message: WorkspaceMessages.WORKSPACE_DATA_DELETED });
  } catch (error) {
    console.error(WorkspaceMessages.ERROR_DELETING_WORKSPACE , error);
    res.status(500).json({ message: WorkspaceMessages.ERROR_DELETING_WORKSPACE , error: error.message });
  }
};


// Update workspace name
export const updateWorkspace = async (req, res) => {
  try {
    let { workspacename } = req.body;
    workspacename = workspacename.toLowerCase();

    const { id } = req.params;

    if (!workspacename) {
      return res.status(400).json({ success: false, message: WorkspaceMessages.WORKSPACE_NAME_REQUIRED
    
       });
    }

    // Find the existing workspace before updating
    const existingWorkspace = await Workspace.findById(id);
    if (!existingWorkspace) {
      return res.status(404).json({ success: false, message: WorkspaceMessages.WORKSPACE_NOT_FOUND });
    }

    const oldWorkspaceName = existingWorkspace.workspacename; // Store old workspace name

    // 1. Update the workspace name in the Workspace model
    const updatedWorkspace = await Workspace.findByIdAndUpdate(
      id,
      { workspacename },
      { new: true }
    );

    // 2. Update workspace name in the User model (array of workspaceName)
    await User.updateMany(
      { workspaceName: oldWorkspaceName },
      { $set: { "workspaceName.$[elem]": workspacename } },
      { arrayFilters: [{ elem: oldWorkspaceName }] }
    );

    // 3. Update workspace name in the Admin model (array of workspaceName)
    await Admin.updateMany(
      { workspaceName: oldWorkspaceName },
      { $set: { "workspaceName.$[elem]": workspacename } },
      { arrayFilters: [{ elem: oldWorkspaceName }] }
    );

     // 4. Update workspace name in the Team model (single field)
     const teamResult = await Teams.updateMany(
      { workspaceName: oldWorkspaceName },
      { $set: { workspaceName: workspacename } }
    );
    
    // 5. Update workspace name in the Stream model (single field)
    const streamResult = await Streams.updateMany(
      { workspaceName: oldWorkspaceName },
      { $set: { workspaceName: workspacename } }
    );
   

    // 5. Update workspace name in the Stream model (single field)
    const actionResult = await Action.updateMany(
      { workspaceName: oldWorkspaceName },
      { $set: { workspaceName: workspacename } }
    );

    // 6. Update workspace name in the Product model (single field)
    await Product.updateMany(
      { workspacename: oldWorkspaceName },
      { $set: { workspacename: workspacename } }
    );

    // 7. Update workspacename in all Posts
      await Post.updateMany(
        { workspacename: oldWorkspaceName },
        { $set: { workspacename: workspacename } }
      );

      // 8. Update workspace name in the AssetAcknowledgement model
        await AssetAcknowledgement.updateMany(
          { workspacename: oldWorkspaceName },
          { $set: { workspacename: workspacename } }
        );

        // 9. Update workspace name in the AssignedBadge model
          await AssignedBadge.updateMany(
            { workspacename: oldWorkspaceName },
            { $set: { workspacename: workspacename } }
          );

          // 10. Update workspace name in the AssignedProduct model
            await AssignedProduct.updateMany(
              { workspacename: oldWorkspaceName },
              { $set: { workspacename: workspacename } }
            );

            // 11. Update workspace name in the Feedback model
            await Feedback.updateMany(
              { workspacename: oldWorkspaceName },
              { $set: { workspacename: workspacename } }
            );

            // 12. Update workspace name in the FeedbackRequest model
          await FeedbackRequest.updateMany(
            { workspacename: oldWorkspaceName },
            { $set: { workspacename: workspacename } }
          );

          // 13. Update workspace name in the InternalNode model
          await InternalNode.updateMany(
            { workspacename: oldWorkspaceName },
            { $set: { workspacename: workspacename } }
          );

          // 14. Update workspace name in the Requested Feedback model
          await StoreRequestedFeedback.updateMany(
            { workspacename: oldWorkspaceName },
            { $set: { workspacename: workspacename } }
          );

          //15. Update workspace name in the SubStream model
            await SubStream.updateMany(
              { workspacename: oldWorkspaceName },
              { $set: { workspacename: workspacename } }
            );



    res.status(200).json({
      success: true,
      message: WorkspaceMessages.WORKSPACE_UPDATED_IN_ALL,
      workspace: updatedWorkspace,
    });
  } catch (error) {
  
    res.status(500).json({ success: false, message: CommonMessages.SERVER_ERROR , error: error.message });
  }
};

export const getUserWorkspaces = async (req, res) => {
  try {
    const { email } = req.params;

    // Fetch all users with the given email
    const users = await User.find({ email });

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: WorkspaceMessages.USER_NOT_FOUND });
    }

    // Extract workspace names from all users
    const workspaceNames = users.flatMap(user => user.workspaceName || []);

    // Fetch workspaces based on workspace names
    const workspaces = await Workspace.find({ workspacename: { $in: workspaceNames } });

    res.status(200).json({ success: true, workspaces });
  } catch (error) {
    console.error("Error fetching user workspaces:", error);
    res.status(500).json({ success: false, message: WorkspaceMessages.ERROR_FETCHING_WORKSPACE });
  }
};