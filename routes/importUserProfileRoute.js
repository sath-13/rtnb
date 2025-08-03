import express from 'express';
import { importUserProfiles } from '../controllers/importUserProfileController.js';
import { getImportedUserProfiles } from '../controllers/getImportedUserProfilesController.js';
const router = express.Router();

router.post('/', importUserProfiles);
router.get('/', getImportedUserProfiles);

export default router;
