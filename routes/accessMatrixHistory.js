import express from 'express';
import { getAccessMatrixHistory, logAccessMatrixChange } from '../controllers/accessMatrixHistoryController.js';

const router = express.Router();

// GET history for a company
router.get('/matrix-history/:companyId', getAccessMatrixHistory);

// POST log a new change
router.post('/matrix-history/log', logAccessMatrixChange);

export default router;
