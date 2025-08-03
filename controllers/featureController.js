import StatusCodes from 'http-status-codes';
import Feature from '../models/feature-Model.js';
import Project from '../models/Project.js';
import {
  BadRequest,
  InternalServer,
} from '../middlewares/customError.js';
import { FeatureMessages } from '../constants/enums.js';

export const getAllFeatures = async (req, res, next) => {
  try {
    const features = await Feature.find();
    res.status(StatusCodes.OK).json({
      features,
      message: FeatureMessages.FEATURES_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(FeatureMessages.ERROR_FETCHING_FEATURES));
  }
};

export const getFeatureById = async (req, res, next) => {
  try {
    const feature = await Feature.findById(req.params.id);
    if (!feature) {
      return next(BadRequest(FeatureMessages.FEATURE_NOT_FOUND));
    }
    res.status(StatusCodes.OK).json({
      feature,
      message: FeatureMessages.FEATURE_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(FeatureMessages.ERROR_FETCHING_FEATURE));
  }
};

export const createFeature = async (req, res, next) => {
  try {
    const newFeature = new Feature(req.body);
    const savedFeature = await newFeature.save();
    res.status(StatusCodes.CREATED).json({
      feature: savedFeature,
      message: FeatureMessages.FEATURE_CREATED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(FeatureMessages.ERROR_CREATING_FEATURE));
  }
};

export const updateFeature = async (req, res, next) => {
  try {
    const updatedFeature = await Feature.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );
    if (!updatedFeature) {
      return next(BadRequest(FeatureMessages.FEATURE_NOT_FOUND));
    }
    res.status(StatusCodes.OK).json({
      feature: updatedFeature,
      message: FeatureMessages.FEATURE_UPDATED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(FeatureMessages.ERROR_UPDATING_FEATURE));
  }
};

export const deleteFeature = async (req, res, next) => {
  try {
    const deletedFeature = await Feature.findByIdAndDelete(req.params.id);
    if (!deletedFeature) {
      return next(BadRequest(FeatureMessages.FEATURE_NOT_FOUND));
    }
    res.status(StatusCodes.OK).json({
      message: FeatureMessages.FEATURE_DELETED_SUCCESSFULLY,
    });
  } catch (error) {
    next(InternalServer(FeatureMessages.ERROR_DELETING_FEATURE));
  }
};

export const addProjectFeature = async (req, res, next) => {
  try {
      const { project_id, feature_id } = req.body;
      if (!project_id || !feature_id) {
          return next(BadRequest(FeatureMessages.INVALID_REQUEST_PARAMETERS));
      }
      const project = await Project.findById(project_id);
      if (!project) {
          return next(BadRequest(FeatureMessages.PROJECT_NOT_FOUND));
      }
      if (project.feature.includes(feature_id)) {
          return next(BadRequest(FeatureMessages.FEATURE_ALREADY_EXISTS));
      }

      project.feature.push(feature_id);
      await project.save();
      const updatedProject = await Project.findById(project_id)
          .populate('feature');

      res.status(StatusCodes.OK).json({
          message: FeatureMessages.FEATURE_ADDED_SUCCESSFULLY,
          project: updatedProject
      });

  } catch (error) {    
      next(InternalServer(FeatureMessages.ERROR_ADDING_FEATURE));
  }
};

export const removeProjectFeature = async (req, res, next) => {
  try {
      const { project_id, feature_id } = req.params;
      if (!project_id || !feature_id) {
          return next(BadRequest(FeatureMessages.INVALID_REQUEST_PARAMETERS));
      }
      const project = await Project.findById(project_id);
      if (!project) {
          return next(BadRequest(FeatureMessages.PROJECT_NOT_FOUND));
      }
      if (!project.feature.includes(feature_id)) {
          return next(BadRequest(FeatureMessages.FEATURE_NOT_FOUND));
      }

      project.feature = project.feature.filter(
          feature => feature.toString() !== feature_id
      );
      await project.save();

      const updatedProject = await Project.findById(project_id)
          .populate('feature');

      res.status(StatusCodes.OK).json({
          message: FeatureMessages.FEATURE_REMOVED_SUCCESSFULLY,
          project: updatedProject
      });

  } catch (error) {
      next(InternalServer(FeatureMessages.ERROR_REMOVING_FEATURE));
  }
};
