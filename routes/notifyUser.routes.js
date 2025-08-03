import express from "express";
import { notifyUsers } from "../controllers/notifyUsersController.js";

const router = express.Router();

// Route for notifying users
router.post("/:id", notifyUsers);


export default router;
