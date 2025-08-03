// routes/roleAccess.js
import express from 'express';
import { getRoleAccessMatrix , bulkUpdateRoleAccess , getModuleAccess, getAllRoles, createSystemRole } from '../controllers/RoleAccessController.js';

const router = express.Router();

// Route for fetching matrix
router.get('/matrix/:companyId', getRoleAccessMatrix);
// routes/roleAccessRoutes.js
router.put('/bulk-update', bulkUpdateRoleAccess);


router.get("/module-access", getModuleAccess);
router.get('/roles', getAllRoles);
router.post('/create-system-role', createSystemRole);

export default router;
