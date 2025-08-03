import express from 'express';
import complianceTestRoutes from './complianceTest.route.js';
import apiRoutes from './api.route.js';

const router = express.Router();

router.use('/api', apiRoutes);
router.use('/compliance-test', complianceTestRoutes);

export default router;