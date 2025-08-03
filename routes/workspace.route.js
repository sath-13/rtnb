import express from 'express';
import multer from "multer";

//import authMiddleware from '../middlewares/authMiddleware.js';
import { createWorkspace, getAllWorkspaces, 
    deleteWorkspace, getWorkspaceByName, 
    checkWorkspacenameAvailability, updateWorkspace,
     uploadLogo, updateWorkspaceLogo
    ,checkWorkspaceName, checkWorkspaceEditName,
    getUserWorkspaces} from '../controllers/workspace.controller.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { verifySuperAdmin } from '../middlewares/verifySuperAdmin.js';

const router = express.Router();
const upload = multer(); // Memory storage for handling file uploads


// Workspace creation route - Only superadmins can create workspaces
router.post('/create', authMiddleware, verifySuperAdmin,uploadLogo, createWorkspace);
router.get("/check-name", authMiddleware,verifySuperAdmin ,checkWorkspaceName);
router.get("/check-name-edit", authMiddleware,verifySuperAdmin ,checkWorkspaceEditName);

router.get("/check-workspacename/:workspacename", checkWorkspacenameAvailability);

router.put("/update/:id", updateWorkspace);
router.put("/update-logo/:id", upload.single("logo"), updateWorkspaceLogo);

router.get("/user/:email", getUserWorkspaces);

// Fetch all workspaces - Only superadmins can view all workspaces
router.get("/all", authMiddleware,  getAllWorkspaces);

// Delete workspace - Only superadmins can delete workspaces
router.delete("/:id", authMiddleware, verifySuperAdmin, deleteWorkspace);

// Get workspace by name - Only superadmins can access workspace by name
router.get("/workspacename/:workspacename", 
    // authMiddleware, verifySuperAdmin, 
    getWorkspaceByName);

export default router;
