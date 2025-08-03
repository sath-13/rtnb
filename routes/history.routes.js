import express from 'express';

import { getHistoryByActionId, logHistory } from '../controllers/history.controller.js';

const router = express.Router();

router.get("/:actionId", getHistoryByActionId);
router.post("/log", logHistory);

export default router;
