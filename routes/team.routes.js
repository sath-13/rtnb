// routes/team.routes.js

import express from 'express';
import { createTeam, getTeamsInWorkspace, deleteTeamFromWorkspace, updateTeamFromWorkspace } from '../controllers/team.controller.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { verifySuperAdmin } from '../middlewares/verifySuperAdmin.js';
import authenticateUser from '../middlewares/login.js';
import { addNewFieldToAllExistingData, deleteTeamById, getAllTeams, getTeamById, updateTeamById } from '../controllers/team.controller.js';

const router = express.Router();

router.get("/:id",authMiddleware,getTeamById);
router.get("/workspacename/:workspaceName",getAllTeams);
router.post('/', authMiddleware, verifySuperAdmin,createTeam);
router.get('/workspace/:workspaceName',authMiddleware, getTeamsInWorkspace);
router.delete('/:id', authMiddleware, verifySuperAdmin,deleteTeamFromWorkspace);
router.put('/:id',authMiddleware, verifySuperAdmin,updateTeamFromWorkspace);
router.patch("/update/:id",authMiddleware,updateTeamById);
//router.put("/add-new-field", addNewFieldToAllExistingData);

export default router;