import express from 'express';
import { createAction, getActions, updateActionStatus, getActionById, updateActionText, addUserToAction, getActionDetails, removeUserFromAction  , getFilesForAction , updateAssignedUser , uploadFiles } from '../controllers/actionController.js';
import upload from '../middlewares/upload.js'; // Import Multer Middleware

const router = express.Router();

router.get("/action-details/:id", getActionDetails);
router.post('/create', upload.array("files", 5), createAction); // Allow multiple files
router.patch('/:id', updateActionStatus);
router.put('/:id', updateActionText);
router.get('/action/:id', getActionById);
router.patch('/:actionId/addUserToAction', addUserToAction);
router.delete("/remove-user/:id/:userId", removeUserFromAction);
router.get('/:actionId/files', getFilesForAction);
router.put("/:actionId/reassign", updateAssignedUser);
router.get('/:userAssigned', getActions);
router.post("/:actionId/upload", upload.array("files", 5), uploadFiles);



export default router;


