import express from 'express';
import { getSurveyAnalytics, getScoreAnalytics, getTextualFeedback,getToggleCheckboxAnalytics } from '../controllers/surveyAnalytics.js';
import { getAnalyticsOverview } from '../controllers/surveyController.js';
import SurveyResponse from '../models/SurveyResponse.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import requireAdminOrSuperAdmin from '../middlewares/requireAdminOrSuperAdmin.js';
import mongoose from 'mongoose';

const router = express.Router();

// ✅ GET /analytics/overview — Return dashboard metrics
router.get('/overview', authMiddleware, getAnalyticsOverview);

// Route for specific analytics types
router.get('/api/surveys/:sid/analytics/:type',authMiddleware, requireAdminOrSuperAdmin, (req, res, next) => {
  console.log(`Analytics request: ${req.params.sid}, type: ${req.params.type}`);
  next();
}, getSurveyAnalytics);

// Route for general analytics (overview)
router.get('/api/surveys/:sid/analytics',authMiddleware, requireAdminOrSuperAdmin, (req, res, next) => {
  console.log("fetching sid")
  console.log(`Analytics request: ${req.params.sid}, overview`);
  next();
}, getSurveyAnalytics);

// Route to get list of surveys (for dashboard)
router.get('/api/surveys', authMiddleware, requireAdminOrSuperAdmin, async (req, res) => {
  try {
    console.log('Fetching surveys...');
    const { workspace } = req.query;
    console.log(workspace)

    // Build match stage for aggregation
    const matchStage = workspace ? { $match: { workspace } } : null;
    const aggregationPipeline = [];
    if (matchStage) aggregationPipeline.push(matchStage);
    aggregationPipeline.push(
      {
        $group: {
          _id: '$sid',
          title: { $first: '$title' }, // Preserve the title field
          totalResponses: { $sum: { $size: '$responses' } },
          lastUpdated: { $max: '$updatedAt' }
        }
      },
      {
        $project: {
          _id: 0,
          sid: '$_id',
          title: { $ifNull: ['$title', 'Untitled Survey'] },
          responses: '$totalResponses',
          lastUpdated: '$lastUpdated'
        }
      },
      { $sort: { sid: 1 } }
    );

    const surveysAggregation = await SurveyResponse.aggregate(aggregationPipeline);
    res.json(surveysAggregation);
  } catch (err) {
    console.error('Error fetching surveys:', err);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// Route to test data structure
router.get('/api/test/:sid', async (req, res) => {
  try {
    const { sid } = req.params;
    
    // Simple aggregation to see raw data
    const rawData = await SurveyResponse.aggregate([
      { $match: { sid } },
      { $unwind: "$responses" },
      { $unwind: "$responses.answers" },
      { $limit: 5 } // Just get first 5 records
    ]);
    
    console.log('Raw data:', JSON.stringify(rawData, null, 2));
    res.json(rawData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Test failed' });
  }
});

// Route to get textual feedback from open-ended questions
router.get('/api/surveys/:sid/feedback', async (req, res) => {
  try {
    const { sid } = req.params;
    console.log(`Feedback request: ${sid}`);
    
    const feedback = await getTextualFeedback(sid);
    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve feedback" });
  }
});

export default router;
