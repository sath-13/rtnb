import express from 'express';
import * as complianceTestController from '../controllers/complianceTest.controller.js';

const router = express.Router();

router.post('/generate-compliance-test', complianceTestController.generateComplianceTest);

export default router;