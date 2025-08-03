import express from 'express';
import { createRole , getRolesByCompanyId } from '../controllers/CompanyRoleController.js'; // Import the controller

const router = express.Router();

// Define the route to create a role
router.post('/create-role', createRole);

router.get('/roles', getRolesByCompanyId); 

export default router;



