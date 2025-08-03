import express from 'express';
import * as complianceTestController from '../controllers/complianceTest.controller.js';

const router = express.Router();

router.post('/', complianceTestController.saveTest);
router.get('/:testId', complianceTestController.getTest);
router.post('/submit', complianceTestController.submitTest);

// New routes for surveys management
router.get('/surveys/all', complianceTestController.getAllComplianceSurveys);
router.get('/survey-responses/overview', complianceTestController.getSurveyResponsesOverview);
router.get('/survey/:surveyId/responses', complianceTestController.getSurveyDetailedResponses);

export default router;