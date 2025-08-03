import { eventMessages, UserMessages } from '../constants/enums.js';
import Event from '../models/Events.model.js';
import User from '../models/user-model.js';

import mongoose from 'mongoose';

/**
 * GET /api/events
 * @desc Fetch all events with their details and attendance info for the logged-in user
 */
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();

    // const userId = req.userId;
    const userId = req.user?.userId || req.userId;
if (!userId) {
  console.warn(eventMessages.USER_ID_MISSING);

}
    const eventsWithAttendance = events.map(event => {
      const sessions = event.sessions.map(session => {
        const attendees = session.attendees || [];
        const isAttending = userId ? attendees.some(id => id.toString() === userId) : false;
        return { ...session.toObject(), isAttending };
      });
      return {
        ...event.toObject(),
        sessions
      };
    });

    res.status(200).json({ success: true, data: eventsWithAttendance });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, message: eventMessages.SERVER_ERR_FETCH });
  }
};



// controllers/eventController.js
// Get events where the user was marked as attending (by admin)
// controllers/eventController.js
export const getAttendedEventsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const events = await Event.find({
      attendance: {
        $elemMatch: {
          user: userId,
          isAttending: true
        }
      }
    });

    res.status(200).json({ events });
  } catch (err) {
    console.error("Error fetching attended events:", err);
    res.status(500).json({ error: eventMessages.FAILED_TO_FETCH_ATTENDED_EVENTS });
  }
};





/**
 * POST /api/events/:eventId/sessions/:sessionId/attendance
 * @desc Toggle user's attendance for a specific session in an event
 */
export const toggleAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, isAttending } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: eventMessages.INVALID_ID });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: eventMessages.EVENT_NOT_FOUND });
    }

    // Check if user already has an attendance record
    const existingIndex = event.attendance.findIndex(att => att.user.toString() === userId);

    if (existingIndex > -1) {
      // Update existing attendance
      event.attendance[existingIndex].isAttending = isAttending;
    } else {
      // Add new attendance record
      event.attendance.push({ user: userId, isAttending });
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: eventMessages.ATTENDANCE_UPDATED_SUCCESSFULY,
      attendance: event.attendance
    });
  } catch (error) {
    console.error('Error toggling attendance:', error);
    res.status(500).json({ success: false, message: eventMessages.SERVER_ERROR_WHILE_UPDATING_ATTENDANCE });
  }
};



export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      reminder,
      sessionTitle,
      startTime,
      endTime,
      userAssigned,
    } = req.body;

    const event = new Event({
      title,
      description,
      location,
      reminder: reminder || null,
      sessions: [
        {
          title: sessionTitle,
          startTime,
          endTime,
        },
      ],
      userAssigned: Array.isArray(userAssigned) ? userAssigned : [userAssigned],
      file: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Get events assigned to a specific user
export const getAssignedEventsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const events = await Event.find({
      userAssigned: new mongoose.Types.ObjectId(userId)
    });

    res.status(200).json({ events });
  } catch (err) {
    console.error(eventMessages.ERROR_FETCHING_EVENTS, err);
    res.status(500).json({ error: eventMessages.INTERNAL_SERVER_ERROR });
  }
};

export const markAttendances = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userIds, isAttending } = req.body;
    
    console.log("Mark Attendance Body:",req.body);
    console.log(typeof userIds);

    if (!Array.isArray(userIds) || typeof isAttending !== "boolean") {
      return res.status(400).json({ success: false, message: eventMessages.INVALID_PAYLOAD });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: eventMessages.EVENT_NOT_FOUND });
    }

    // Remove existing attendance entries for these users
    event.attendance = event.attendance.filter(
      (record) => !userIds.includes(record.user.toString())
    );

    // Add new entries
    userIds.forEach((userId) => {
      event.attendance.push({ user: userId, isAttending });
    });

    await event.save();

    res.status(200).json({ success: true, message: eventMessages.ATTENDANCE_UPDATED_SUCCESSFULY, event });
  } catch (err) {
    console.error(eventMessages.ERROR_IN_MARKATTENDANCE, err);
    res.status(500).json({ success: false, message: eventMessages.INTERNAL_SERVER_ERROR });
  }
};




export const getAllUsers = async (req, res) => {
  try {
      const data = await user.find().select("fname"); 
    res.json({ data });
  } catch (error) {
    console.error(UserMessages.ERROR_FETCHING_USERS, error);
    res.status(500).json({ error: eventMessages.INTERNAL_SERVER_ERROR });
  }
};


export const cancelEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { reason } = req.body;

    const event = await Event.findByIdAndUpdate(
      eventId,
      { status: "cancelled", cancelReason: reason },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: eventMessages.EVENT_NOT_FOUND });
    }

    res.json({ success: true, event });
  } catch (err) {
    console.error(eventMessages.ERROR_CANCELLING_EVENTS, err);
    res.status(500).json({ success: false, message: eventMessages.INTERNAL_SERVER_ERROR });
  }
};


export const getUsersInWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!workspaceId) {
      return res.status(400).json({ msg: "Workspace ID is required" });
    }

    const users = await User.find({ workspace: workspaceId }).select("fname lname email _id"); // Adjust fields as needed

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users in workspace:", error);
    return res.status(500).json({ msg: "Server error while fetching users" });
  }
};
