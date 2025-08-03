// controllers/team.controller.js

import { StatusCodes } from 'http-status-codes';
import { CommonMessages, TeamMessages } from '../constants/enums.js';
import Teams from '../models/team-model.js';
import { NotFound,BadRequest } from '../middlewares/customError.js';
import Admin from "../models/SuperAdmin-model.js";

export const createTeam = async (req, res) => {
  try {
    const { teamTitle, workspaceName, stream, subStreams, adminId ,teamDescriptions } = req.body;

    // Check if a team with this title already exists in the workspace
    const existingTeam = await Teams.findOne({ teamTitle, workspaceName });
    if (existingTeam) {
      return res.status(400).json({ msg: TeamMessages.TITLE_ALREADY_EXISTS });
    }

    const newTeam = new Teams({
      teamTitle,
      workspaceName,
	  teamDescriptions,
      stream,
      subStreams: subStreams && subStreams.length > 0 ? subStreams : [],
    });

    await newTeam.save();

    // Update the Admin document (superadmin) to include this team title.
    // Only update if adminId is provided.
    if (adminId) {
      await Admin.findByIdAndUpdate(adminId, { $push: { teamTitle: teamTitle } });
    }

    res.status(201).json({ msg: TeamMessages.TEAM_CREATED_SUCCESSFULLY, team: newTeam });
  } catch (err) {
    console.error(TeamMessages.ERROR_CREATING_TEAM , err);
    res.status(500).json({ msg: TeamMessages.ERROR_CREATING_TEAM, error: err.message });
  }
};


export const getTeamsInWorkspace = async (req, res) => {
    try {
        const { workspaceName } = req.params;
        const teams = await Teams.find({ workspaceName });
        res.status(200).json(teams);
    } catch (err) {
        console.error(TeamMessages.ERROR_FETCHING_TEAM, err);
        res.status(500).json({ msg: TeamMessages.ERROR_FETCHING_TEAM , error: err.message });
    }
};


export const updateTeamFromWorkspace = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Teams.findById(id);
    if (!team) {
      return res.status(404).json({ message: TeamMessages.TEAM_NOT_FOUND });
    }

    const oldTeamTitle = team.teamTitle;
    const updatedTeam = await Teams.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedTeam) {
      return res.status(404).json({ message: TeamMessages.TEAM_NOT_FOUND });
    }

    // If the team title has changed, update the admin document
    if (req.body.teamTitle && req.body.teamTitle !== oldTeamTitle) {
      // Ensure req.user is set via your authentication middleware
      const adminId = req.user && req.user.id ? req.user.id : null;
      if (adminId) {
        // First, remove the old team title from the admin's teamTitle array
        await Admin.findByIdAndUpdate(adminId, { $pull: { teamTitle: oldTeamTitle } });
        // Then, add the new team title to the admin's teamTitle array
        await Admin.findByIdAndUpdate(adminId, { $push: { teamTitle: req.body.teamTitle } });
      }
    }

    res.status(200).json({ message: TeamMessages.TEAM_UPDATED_SUCCESSFULLY , team: updatedTeam });
  } catch (error) {
    console.error(TeamMessages.ERROR_UPDATING_TEAM , error);
    res.status(500).json({ message: TeamMessages.ERROR_UPDATING_TEAM, error: error.message });
  }
};

export const deleteTeamFromWorkspace = async (req, res) => {
  try {
    const { id } = req.params; // Team ID
    const team = await Teams.findById(id);
    if (!team) {
      return res.status(404).json({ msg: TeamMessages.TEAM_NOT_FOUND });
    }

    const teamTitle = team.teamTitle;

    // Delete the team from the Teams collection
    await Teams.findByIdAndDelete(id);

    // Update the admin document (using req.user from your auth middleware)
    const adminId = req.user && req.user.id ? req.user.id : null;
    if (adminId) {
      await Admin.findByIdAndUpdate(adminId, { $pull: { teamTitle: teamTitle } });
    }

    res.status(200).json({ msg: TeamMessages.TEAM_DELETED_SUCCESSFULLY });
  } catch (err) {
    console.error(TeamMessages.ERROR_DELETING_TEAM, err);
    res.status(500).json({ msg: TeamMessages.ERROR_DELETING_TEAM, error: err.message });
  }
};


//From Portfolio Management
export const getAllTeams = async (req, res) => {
    try {
        const { workspaceName } = req.params;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;
/*
        const teams = await Teams.find({ workspaceName })
            .skip(skip)
            .limit(limit);
*/
            const teams = await Teams.find({
              workspaceName,
              $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
          }).skip(skip).limit(limit);
          


        const count = await Teams.countDocuments({ workspaceName, isDeleted: false });
        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            message: TeamMessages.TEAMS_FETCHED_SUCCESSFULLY,
            teams,
            totalPages,
            currentPage: page,
            totalTeams: count,
        });
    } catch (err) {
        console.error(TeamMessages.ERROR_FETCHING_TEAM, err);
        res.status(500).json({ msg: TeamMessages.ERROR_FETCHING_TEAM, error: err.message });
    }
};

/**
* This function updates a team by id.
* @static
* @param {Object} req - Request object. Expects teamTitle, hasAssistantCreationAccess.
* @param {Object} res - Response object.
* @returns {Object} - Returns updated team object.
*/
export const updateTeamById = async (req, res, next) => {
	try {
	  const { id } = req.params
	  const { teamTitle, teamDescriptions, hasAssistantCreationAccess } = req.body
  
	  const existingTeam = await Teams.findById(id)
  
	  if (!existingTeam) {
		return next(NotFound(TeamMessages.TEAM_NOT_FOUND))
	  }
  
	  const updatedHasAssistantCreationAccess =
		hasAssistantCreationAccess !== undefined ? hasAssistantCreationAccess : existingTeam.hasAssistantCreationAccess
  
	  const updatedTeam = await Teams.findByIdAndUpdate(
		id,
		{
		  teamTitle,
		  teamDescriptions,
		  hasAssistantCreationAccess: updatedHasAssistantCreationAccess,
		},
		{ new: true },
	  )
  
	  return res.status(StatusCodes.OK).json({
		message: TeamMessages.TEAM_UPDATED_SUCCESSFULLY,
		updatedTeam,
	  })
	} catch (error) {
	  console.error("Error updating team:", error)
	  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: CommonMessages.INTERNAL_SERVER_ERROR })
	}
  }
  
/**
* This function deletes a team by id. 
* @static
* @param {Object} req - Request object.
* @param {Object} res - Response object.
* @returns {Object} - Returns object with deletion message.
*/
export const deleteTeamById = async (req, res, next) => {
	const { id } = req.params;
	try {
		const team = await Teams.findById(id);

		if (team) {
			await Teams.findByIdAndUpdate(
				team._id,
				{ isDeleted: true },
				{ new: true }
			);
			return res.status(StatusCodes.OK).json({
				message: TeamMessages.TEAM_DELETED_SUCCESSFULLY,
			});
		} else {
			return next(NotFound(TeamMessages.TEAM_NOT_FOUND));
		}
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			message: CommonMessages.INTERNAL_SERVER_ERROR,
		});
	}
};

/**
* This function gets a team by id. 
* @static
* @param {Object} req - Request object.
* @param {Object} res - Response object.
* @returns {Object} - Returns a team object.
*/
export const getTeamById = async (req, res, next) => {
	const { id } = req.params;
	try {
		const team = await Teams.findById(id);

		if (team) {
			return res.status(StatusCodes.OK).json({
				message: TeamMessages.TEAM_FETCHED_SUCCESSFULLY,
				team,
			});
		} else {
			return next(NotFound(TeamMessages.TEAM_NOT_FOUND));
		}
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			message: CommonMessages.INTERNAL_SERVER_ERROR,
		});
	}
};

/**
* This function adds a new field to all existing teams. 
* @static
* @param {Object} req - Request object.
* @param {Object} res - Response object.
* @returns {Object} - Returns object with update status.
*/
export const addNewFieldToAllExistingData = async (req, res) => {
	try {
		const newFieldAdded = await Teams.updateMany(
			{},
			{ $set: { isDeleted: false } },
			{ multi: true }
		);

		return res
			.status(StatusCodes.OK)
			.json({ message: TeamMessages.NEW_FIELD_ADDED, newFieldAdded });
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			message: CommonMessages.INTERNAL_SERVER_ERROR,
		});
	}
};

