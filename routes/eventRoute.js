import express from 'express';
import {
  toggleAttendance,
  getAllEvents,
  createEvent,
  getAttendedEventsByUser,
  getAssignedEventsByUser,
  getAllUsers,
  markAttendances,
  cancelEvent,
  getUsersInWorkspace,
} from '../controllers/eventController.js';
import upload from "../middlewares/upload.js";

import authMiddleware from '../middlewares/authMiddleware.js';


const router = express.Router();

router.post("/create", authMiddleware, upload.single("file"), createEvent);

// Get all events
router.get('/', getAllEvents);

router.get("/user", getAllUsers);

// routes/eventRoutes.js
router.get("/attended/:userId", authMiddleware, getAttendedEventsByUser);


// Toggle attendance for a session
router.post('/:eventId/toggleattendance',authMiddleware, toggleAttendance);

router.get("/assigned/:userId", authMiddleware, getAssignedEventsByUser);

// Mark attendance (admin-level)
router.post('/:eventId/attendance', authMiddleware, markAttendances);

router.put('/:eventId/cancel',authMiddleware, cancelEvent);

router.get('/workspace/:workspaceId', getUsersInWorkspace);



export default router;
