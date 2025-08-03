import express from 'express';
import { createCompany, checkCompanyName, fetchCompanyDetail } from '../controllers/domainController.js';

const router = express.Router();

// Route to create a new company
router.post('/create', createCompany);

// Route to check if a company name already exists
router.post('/check-name', checkCompanyName);
router.get("/fetchCompanyDetail", fetchCompanyDetail);
export default router;
