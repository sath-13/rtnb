import StatusCodes from 'http-status-codes';
import ProjectTeam from '../models/projectTeamModel.js';
import Project from '../models/Project.js';
import { BadRequest, InternalServer } from '../middlewares/customError.js';
import { ProjectTeamMessages } from '../constants/enums.js';

export const getProjectTeamMembers = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const teamMembers = await ProjectTeam.find({ project_id: projectId }).populate('user_id', 'fname lname status');
    res.status(StatusCodes.OK).json({
      teamMembers,
      message: ProjectTeamMessages.TEAM_MEMBERS_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ProjectTeamMessages.ERROR_FETCHING_TEAM_MEMBERS));
  }
};

export const getProjectTeamMembersByTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const teamMembers = await ProjectTeam.find({ team_id: teamId }).populate('user_id', 'fname lname status');
    res.status(StatusCodes.OK).json({
      teamMembers,
      message: ProjectTeamMessages.TEAM_MEMBERS_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ProjectTeamMessages.ERROR_FETCHING_TEAM_MEMBERS));
  }
};

export const getProjectsByTeamId = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const projectTeamEntries = await ProjectTeam.find({ team_id: teamId });
    const projectIds = projectTeamEntries.map(entry => entry.project_id);

    const projects = await Project.find({ _id: { $in: projectIds } });

    res.status(StatusCodes.OK).json({
      projects,
      message: ProjectTeamMessages.PROJECTS_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ProjectTeamMessages.ERROR_FETCHING_PROJECTS));
  }
};

export const getAllProjectTeams = async (req, res, next) => {
  try {
    const allProjectTeams = await ProjectTeam.find();
    res.status(StatusCodes.OK).json({
      projectTeams: allProjectTeams,
      message: ProjectTeamMessages.PROJECT_TEAMS_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ProjectTeamMessages.ERROR_FETCHING_PROJECT_TEAMS));
  }
};


export const getUserRolesByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const userRoles = await ProjectTeam.find({ user_id: userId })
      .populate('project_id', 'name')
    if (!userRoles || userRoles.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: ProjectTeamMessages.USER_ROLES_NOT_FOUND,
      });
    }
    const formattedRoles = userRoles.map(role => ({
      projectName: role.project_id ? role.project_id.name : ProjectTeamMessages.UNKNOWN_PROJECT,
      teamName: role.team_id ? role.team_id.teamTitle : ProjectTeamMessages.NO_TEAM,
      roleInProject: role.role_in_project,
    }));
    res.status(StatusCodes.OK).json({
      userRoles: formattedRoles,
      message: ProjectTeamMessages.USER_ROLES_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    console.error('Error in getUserRolesByUserId:', error);
    console.error('Stack trace:', error.stack);
    next(InternalServer(ProjectTeamMessages.ERROR_FETCHING_USER_ROLES));
  }
};

export const addProjectTeamMember = async (req,res,next)=>{
 try{
  const {project_id,user_id,role_in_project,team_id}=req.body;

  if(!project_id || !user_id || !role_in_project || !team_id)
  {
    return next(BadRequest(ProjectTeamMessages.PROJECT_TEAMS_NOT_FOUND));
  }

  const existingMember=await ProjectTeam.findOne({project_id,user_id});
  if(existingMember){
    return next(BadRequest("User is already part of the project team."))
  }

  const newTeamMember = await ProjectTeam.create({project_id,user_id,role_in_project,team_id});

  res.status(StatusCodes.CREATED).json({
    ProjectTeam:newTeamMember,
    message:ProjectTeamMessages.PROJECT_TEAMS_MEMBER_ADDED_SUCCESSFULLY,
  });
 }
 catch(error)
 {
  next(InternalServer(ProjectTeamMessages.ERROR_ADDING_TEAM_MEMBER));
 }

};

export const deleteProjectTeamMember = async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;

    if (!projectId || !userId) {
      return next(BadRequest(ProjectTeamMessages.INVALID_REQUEST_PARAMETERS));
    }

    const existingMember = await ProjectTeam.findOne({
      project_id: projectId,
      user_id: userId
    });

    if (!existingMember) {
      return next(BadRequest(ProjectTeamMessages.TEAM_MEMBER_NOT_FOUND));
    }

    await ProjectTeam.findByIdAndDelete(existingMember._id);
    res.status(StatusCodes.OK).json({
      message: ProjectTeamMessages.TEAM_MEMBER_REMOVED_SUCCESSFULLY
    });
  } catch (error) {
    next(InternalServer(ProjectTeamMessages.ERROR_REMOVING_TEAM_MEMBER));
  }
};