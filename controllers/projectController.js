import StatusCodes from 'http-status-codes';
import Project from "../models/Project.js";
import mongoose from 'mongoose';
import { BadRequest, InternalServer } from '../middlewares/customError.js';
import { ProjectMessages } from '../constants/enums.js';
import Booking from '../models/ResourceAlloccationModel.js';

export const getAllProjects = async (req, res, next) => {
  try {
    const { sortBy, search } = req.query;
    let sortCriteria = {};

    if (sortBy === 'recent') {
      sortCriteria.start_time = -1;
    }

    let projects = await Project.find({})
      .sort(sortCriteria)
      .populate('client_id')
      .populate('feature')
      .populate('techStack')
      .populate('team_id');

    if (search) {
      projects = projects.filter((project) =>
        project.name.match(new RegExp(search, 'i')) ||
        project.team_id?.teamTitle?.match(new RegExp(search, 'i'))
      );
    }

    res.status(StatusCodes.OK).json({
      projects,
      message: ProjectMessages.PROJECTS_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ProjectMessages.ERROR_FETCHING_PROJECTS));
    console.error("Error",error);
  }
};

export const getProjectById = async (req, res, next) => {
  const { clientId } = req.params;
  try {
    const projects = await Project.find({ client_id: clientId })
      .populate('client_id', 'name')
      .populate('team_id', 'name')
      .populate('feature', 'name')
      .populate('techStack', 'name');

    if (projects.length === 0) {
      return next(BadRequest(ProjectMessages.NO_PROJECTS_FOUND));
    }
    res.status(StatusCodes.OK).json({
      projects,
      message: ProjectMessages.PROJECTS_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ProjectMessages.ERROR_FETCHING_PROJECTS));
  }
};

export const createProject = async (req, res, next) => {
  try {
    const newProject = new Project(req.body);
    const savedProject = await newProject.save();
    res.status(StatusCodes.CREATED).json({
      project: savedProject,
      message: ProjectMessages.PROJECT_CREATED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ProjectMessages.ERROR_CREATING_PROJECT));
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const updatedProject = await Project.findOneAndUpdate(
      { _id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!updatedProject) {
      return next(BadRequest(ProjectMessages.PROJECT_NOT_FOUND));
    }
    res.status(StatusCodes.OK).json({
      project: updatedProject,
      message: ProjectMessages.PROJECT_UPDATED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ProjectMessages.ERROR_UPDATING_PROJECT));
  }
};

  export const deleteProject = async (req, res, next) => {
    try {
      // Delete the project
      const deletedProject = await Project.findOneAndDelete({ _id: req.params.id });

      if (!deletedProject) {
        return next(BadRequest(ProjectMessages.PROJECT_NOT_FOUND));
      }

      // Delete all bookings related to the project
      await Booking.deleteMany({ projectId: req.params.id });

      res.status(StatusCodes.OK).json({
        message: ProjectMessages.PROJECT_DELETED_SUCCESSFULLY,
      });
    } catch (error) {
      next(InternalServer(ProjectMessages.ERROR_DELETING_PROJECT));
    }
  };

export const getProjectsByTeam = async (req, res, next) => {
  const { teamId } = req.params;

  try {
    const projects = await Project.find({ team_id: mongoose.Types.ObjectId(teamId) })
      .populate('team_id', 'name');  

    if (projects.length === 0) {
      return next(BadRequest(ProjectMessages.NO_PROJECTS_FOUND));
    }

    res.status(StatusCodes.OK).json({
      projects,
      message: ProjectMessages.PROJECTS_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ProjectMessages.ERROR_FETCHING_PROJECTS));
  }
};

export const getProjectsByClient = async (req, res, next) => {
  const { clientId } = req.params;
  try {
    const projects = await Project.find({ client_id: clientId });
    if (projects.length === 0) {
      return next(BadRequest(ProjectMessages.NO_PROJECTS_FOUND));
    }
    res.status(StatusCodes.OK).json({
      projects,
      message: ProjectMessages.PROJECTS_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ProjectMessages.ERROR_FETCHING_PROJECTS));
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(StatusCodes.OK).json({
      projects,
      message: ProjectMessages.PROJECTS_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ProjectMessages.ERROR_FETCHING_PROJECTS));
  }
};

export const getProjectByProjectId = async (req, res, next) => {
  const { id } = req.params;
  try {
    const project = await Project.findById(id)
      .populate('client_id', 'name')
      .populate('team_id')
      .populate('feature', 'name')
      .populate('techStack', 'name');

    if (!project) {
      return next(BadRequest(ProjectMessages.PROJECT_NOT_FOUND));
    }

    res.status(StatusCodes.OK).json({
      project,
      message: ProjectMessages.PROJECT_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ProjectMessages.ERROR_FETCHING_PROJECT));
  }
};

export const searchByAllFields = async (req, res, next) => {
  try {
    const { searchTerm } = req.query;

    let projects = await Project.find({})
      .populate('client_id')
      .populate('feature')
      .populate('techStack')
      .populate('team_id');

    if (searchTerm) {
      projects = projects.filter((project) =>
        project.name.match(new RegExp(searchTerm, 'i')) ||
        project.team_id?.teamTitle?.match(new RegExp(searchTerm, 'i')) ||
        project.client_id?.name?.match(new RegExp(searchTerm, 'i')) ||
        project.feature.some((feat) => feat.name.match(new RegExp(searchTerm, 'i'))) ||
        project.techStack.some((tech) => tech.name.match(new RegExp(searchTerm, 'i')))
      );
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: projects,
      message: ProjectMessages.PROJECTS_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(ProjectMessages.ERROR_FETCHING_PROJECTS));
  }
};

export const uploadProjectImage = async (req, res) => {
  try {
    const { id } = req.params;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ProjectMessages.NO_IMAGE_PROVIDED,
      });
    }

    let image_url;
    try {
      image_url = await uploadImageToS3(imageFile.path, "project-images");
    } catch (s3Error) {
      console.error("S3 upload error:", s3Error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ProjectMessages.ERROR_UPLOADING_TO_S3,
        error: s3Error.message,
      });
    }

    const project = await Project.findOneAndUpdate({ _id: id }, { image_link: image_url }, { new: true });

    if (!project) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: ProjectMessages.PROJECT_NOT_FOUND,
      });
    }

    if (imageFile.path) {
      try {
        await fs.unlink(imageFile.path);
      } catch (unlinkError) {
        console.error("Error deleting local file:", unlinkError);
      }
    }

    return res.status(StatusCodes.OK).json({
      message: ProjectMessages.PROJECT_IMAGE_UPLOAD_SUCCESS,
      project,
    });
  } catch (error) {
    console.error("Error uploading project image:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: ProjectMessages.ERROR_UPLOADING_IMAGE,
      error: error.message,
    });
  }
};

export const deleteProjectImage = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: ProjectMessages.PROJECT_NOT_FOUND,
      });
    }

    project.image_link = "";
    await project.save();

    return res.status(StatusCodes.OK).json({
      message: ProjectMessages.PROJECT_IMAGE_DELETE_SUCCESS,
    });
  } catch (error) {
    console.error("Error deleting project image:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: ProjectMessages.ERROR_DELETING_IMAGE,
      error: error.message,
    });
  }
};