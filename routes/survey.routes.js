import express from 'express';
import {
  createSurvey,
  getActiveSurveys,
  getSurveyById,
  submitSurveyResponse,
  getSurveyReports,
  getUserOwnFeedback
} from '../controllers/surveyController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import requireAdminOrSuperAdmin from '../middlewares/requireAdminOrSuperAdmin.js';

const router = express.Router();

// ✅ POST /survey — Save full survey with questions
router.post('/', authMiddleware, requireAdminOrSuperAdmin, createSurvey);

// ✅ GET /surveys/active — Fetch all active surveys  
router.get('/active', getActiveSurveys);

// ✅ GET /surveys/report — Get survey data with responses for feedback (Super Admin only)
router.get('/report', authMiddleware, getSurveyReports);

// ✅ GET /surveys/my-feedback — Get user's own feedback and admin replies (All authenticated users)
router.get('/my-feedback', authMiddleware, getUserOwnFeedback);

// ✅ GET /survey/:surveyId — Fetch a specific survey's questions
router.get('/:surveyId', getSurveyById);

// ✅ POST /survey/submit — Submit survey responses
router.post('/submit', submitSurveyResponse);

export default router;
