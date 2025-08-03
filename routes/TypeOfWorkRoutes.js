import express from 'express';
import { getAllTypeOfWork } from '../controllers/TypeOfWorkController.js';

const router = express.Router();

// GET /api/type-of-work
router.get('/', getAllTypeOfWork);

export default router;
