import express from 'express';
import { generateQuestions } from '../controllers/geminiController.js';

const router = express.Router();

// ✳️ POST /api/ask — Generate Questions via Gemini
router.post('/ask', generateQuestions);

export default router;
