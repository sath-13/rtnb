import express from 'express';
import {
  getAllSurveysForSuperAdmin,
  getSurveyRespondents,
  getUserSurveyResponse,
  getSurveyResponseSummary,
  getAllWorkspacesWithSurveys,
  getSurveysGroupedByWorkspace
} from '../controllers/surveyResponseController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { verifySuperAdmin } from '../middlewares/verifySuperAdmin.js';

const surveyResponseRouter = express.Router();

// All routes require authentication and superadmin role
surveyResponseRouter.use(authMiddleware);
surveyResponseRouter.use(verifySuperAdmin);

// Get all workspaces with survey statistics
surveyResponseRouter.get('/workspaces', getAllWorkspacesWithSurveys);

// Get surveys grouped by workspace
surveyResponseRouter.get('/grouped', getSurveysGroupedByWorkspace);

// Get all surveys with response counts (legacy)
surveyResponseRouter.get('/surveys', getAllSurveysForSuperAdmin);

// Get summary statistics
surveyResponseRouter.get('/summary', getSurveyResponseSummary);

// Get all respondents for a specific survey
surveyResponseRouter.get('/surveys/:sid/respondents', getSurveyRespondents);

// Get detailed response of a specific user for a specific survey
surveyResponseRouter.get('/surveys/:sid/users/:empId', getUserSurveyResponse);

export default surveyResponseRouter;
