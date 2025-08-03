import express from "express";
import { createUser, checkUsernameAvailability, getUsersInWorkspace, deleteUserFromWorkspace, checkEmailAvailability, 
    updateUserStatus, getUsernamesByIds, upload, updateUser, fetchAllUsers,
    getAllUsers, adminUpdateUser, updateUserTeamTitle, importUsers, getUsersByStream,
    resendResetEmails, transferUsersToWorkspace, replicaUsersToWorkspace,
    getAllUsersFromWorkspaces, getUserByKey, importUsersProfileInfo, getAllImportedUsers
     } from "../controllers/user.controller.js"; 
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
console.log("🚨 users.route.js LOADED");

// Existing routes
router.post("/create-user", (req, res) => {
    createUser(req, res);
});

router.get("/check-username/:username", checkUsernameAvailability);
router.get("/check-email/:email/:workspaceName", checkEmailAvailability);
router.get('/stream/:streamTitle/:workspaceName', getUsersByStream);
router.get('/get-all-users', authMiddleware, getAllUsers);
router.get('/fetch-all', authMiddleware, fetchAllUsers);
router.put("/:id", upload.single("userIcon"), updateUser);
router.post("/resend-reset-emails", resendResetEmails);
router.post("/transfer", transferUsersToWorkspace);
router.post("/replica-users", replicaUsersToWorkspace);
router.post("/import", upload.single("file"), importUsers);

router.delete("/:id", deleteUserFromWorkspace);
router.put("/status/:id", updateUserStatus); // Updates only status
router.put("/teamTitle/:id", updateUserTeamTitle); // Updates only teamTitle
router.put("/admin/:id", upload.single("userIcon"), adminUpdateUser);
router.post("/get-usernames", getUsernamesByIds);
router.get("/workspace-users/:email", authMiddleware, getAllUsersFromWorkspaces);
router.get("/key/:key", getUserByKey);
router.post("/import-profile-info", importUsersProfileInfo);  
router.get('/imported-users', getAllImportedUsers);
router.get("/:workspaceName", getUsersInWorkspace);

export default router;
