import { BadRequest, InternalServer } from "../middlewares/customError.js";
import TechStack from "../models/tech_stack.js";
import { TechStackMessages } from '../constants/enums.js';
import { StatusCodes } from "http-status-codes";
import Project from "../models/Project.js";

export const createTechStack = async (req, res) => {
    try {
        const stack = new TechStack(req.body);
        const savedStack = await stack.save();
        res.status(201).json(savedStack);
    } catch (err) {
        res.status(500).json({ message: TechStackMessages.ERROR_CREATING_STACK , err });
    }
};

export const UpdateTechStack = async (req, res, next) => {
    try {
        const { projectId, techStackId } = req.params;
        const updateData = req.body;

        if (!projectId || !techStackId) {
            return next(BadRequest(TechStackMessages.INVALID_REQUEST_PARAMETERS));
        }

        const existingTechStack = await TechStack.findOne({
            project_id: projectId,
            _id: techStackId
        });

        if (!existingTechStack) {
            return next(BadRequest(TechStackMessages.TECH_STACK_NOT_FOUND));
        }

        const updatedTechStack = await TechStack.findByIdAndUpdate(
            existingTechStack._id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(StatusCodes.OK).json({
            message: TechStackMessages.TECH_STACK_UPDATED_SUCCESSFULLY,
            data: updatedTechStack
        });
    } catch (error) {
        next(InternalServer(TechStackMessages.ERROR_UPDATING_TECH_STACK));
    }
};

export const deleteTechStack = async (req, res, next) => {
    try {
        const { projectId, techStackId } = req.params;

        if (!projectId || !techStackId) {
            return next(BadRequest(TechStackMessages.INVALID_REQUEST_PARAMETERS));
        }

        const existingTechStack = await TechStack.findOne({
            project_id: projectId,
            _id: techStackId
        });

        if (!existingTechStack) {
            return next(BadRequest(TechStackMessages.TECH_STACK_NOT_FOUND));
        }

        await TechStack.findByIdAndDelete(existingTechStack._id);
        res.status(StatusCodes.OK).json({
            message: TechStackMessages.TECH_STACK_DELETED_SUCCESSFULLY
        });
    } catch (error) {
        next(InternalServer(TechStackMessages.ERROR_DELETING_TECH_STACK));
    }
};

export const getAllTechStack = async (req, res) => {
    try {
        const tech_stack = await TechStack.find();
        res.status(200).json(tech_stack);
    } catch (error) {
        res.status(500).json({ message: TechStackMessages.ERROR_GETTING_TECH_STACK, error });
    }
};

export const getTechStackById = async (req, res) => {
    try {
        const { id } = req.params;
        const techStack = await TechStack.findById(id);
        if (!techStack) {
            return res.status(404).json({ message: TechStackMessages.TECH_STACK_NOT_FOUND });
        }
        res.status(200).json(techStack);
    } catch (error) {
        res.status(500).json({ message: TechStackMessages.ERROR_GETTING_TECH_STACK_BY_ID, error });
    }
};

export const addProjectTechStack = async (req, res, next) => {
    try {
        const { project_id, tech_stack_id } = req.body;
        if (!project_id || !tech_stack_id) {
            return next(BadRequest(TechStackMessages.INVALID_REQUEST_PARAMETERS));
        }

        // Check if project exists
        const project = await Project.findById(project_id);
        if (!project) {
            return next(BadRequest(TechStackMessages.PROJECT_NOT_FOUND));
        }

        // Check if tech stack is already added to project
        if (project.techStack.includes(tech_stack_id)) {
            return next(BadRequest(TechStackMessages.TECH_STACK_ALREADY_EXISTS));
        }

        // Add tech stack to project
        project.techStack.push(tech_stack_id);
        await project.save();

        const updatedProject = await Project.findById(project_id)
            .populate('techStack');

        res.status(StatusCodes.OK).json({
            message: TechStackMessages.TECH_STACK_ADDED_SUCCESSFULLY,
            project: updatedProject
        });

    } 
    catch (error) {
        next(InternalServer(TechStackMessages.ERROR_ADDING_TECH_STACK));
    }
};

export const removeProjectTechStack = async (req, res, next) => {
    try {
        const { project_id, tech_stack_id } = req.params;

        if (!project_id || !tech_stack_id) {
            return next(BadRequest(TechStackMessages.INVALID_REQUEST_PARAMETERS));
        }

        // Check if project exists
        const project = await Project.findById(project_id);
        if (!project) {
            return next(BadRequest(TechStackMessages.PROJECT_NOT_FOUND));
        }

        // Check if tech stack exists in project
        if (!project.techStack.includes(tech_stack_id)) {
            return next(BadRequest(TechStackMessages.TECH_STACK_NOT_FOUND));
        }

        // Remove tech stack from project
        project.techStack = project.techStack.filter(
            tech => tech.toString() !== tech_stack_id
        );
        await project.save();

        const updatedProject = await Project.findById(project_id)
            .populate('techStack');

        res.status(StatusCodes.OK).json({
            message: TechStackMessages.TECH_STACK_REMOVED_SUCCESSFULLY,
            project: updatedProject
        });

    } catch (error) {
        next(InternalServer(TechStackMessages.ERROR_REMOVING_TECH_STACK));
    }
};
