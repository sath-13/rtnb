import express from 'express';
import { getMonthlyAnniversaries  } from '../controllers/anniverseryController.js';


const router = express.Router();


router.get("/monthly", getMonthlyAnniversaries);


export default router;

