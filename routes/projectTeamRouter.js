import express from 'express';
import { getProjectTeamMembers, getProjectTeamMembersByTeam, getProjectsByTeamId, getAllProjectTeams, getUserRolesByUserId, addProjectTeamMember ,deleteProjectTeamMember} from '../controllers/projectTeamController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const projectteamrouter = express.Router();

projectteamrouter.get('/project/:projectId' ,authMiddleware, getProjectTeamMembers);
projectteamrouter.get('/team/:teamId', authMiddleware, getProjectTeamMembersByTeam);
projectteamrouter.get('/projects/team/:teamId', authMiddleware, getProjectsByTeamId);
projectteamrouter.get('/all', authMiddleware, getAllProjectTeams); // New route to get all project teams
projectteamrouter.get('/user-roles/:userId', getUserRolesByUserId);
projectteamrouter.put('/projectTeams',addProjectTeamMember);
projectteamrouter.delete('/:projectId/member/:userId', deleteProjectTeamMember);

export default projectteamrouter;