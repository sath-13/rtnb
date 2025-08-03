import express from 'express';
import { sendEmailWithAttachment } from '../controllers/emailController.js';

const router = express.Router();

router.post('/send-email', sendEmailWithAttachment);

export default router;
