// routes/reminderRoutes.js
import express from "express";
import { createReminder, getRemindersByWorkspace } from "../controllers/ReminderController.js";

const router = express.Router();

router.post("/create", createReminder); // Create reminder
router.get("/:workspaceName", getRemindersByWorkspace); // Get reminders by workspace

export default router;
