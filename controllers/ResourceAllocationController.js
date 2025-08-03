import CustomError from "../errors/index.js";
import bookingHistory from "../models/ResourceAllocationHistoryModel.js";
import Booking from '../models/ResourceAlloccationModel.js';
import Admin from '../models/SuperAdmin-model.js';
import TypeOfWork from "../models/TypeOfWorkModel.js";
import User from '../models/user-model.js';
import Project from  "../models/Project.js";
import config from "../config.js";

export const createProject = async (req, res) => {
  try {
    const {
      name,
      short_name,
      description,
      status,
      start_time,
      end_time,
      budget,
      hr_taken,
      techStack,
      team_id,
      client_id,
      feature,
      links,
      image_link,
      color,
    } = req.body;

    const newProject = new Project({
      name,
      short_name,
      description,
      status,
      start_time,
      end_time,
      budget,
      hr_taken,
      techStack,
      team_id,
      client_id,
      feature,
      links,
      image_link,
      color,
    });

    const savedProject = await newProject.save();

    res.status(201).json({ success: true, data: savedProject });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

import mongoose from 'mongoose';
import { CommonMessages, ResourceAllocationMessages } from "../constants/enums.js";
import sendEmail from "../utils/sendEmail.js";

export const createBooking = async (req, res) => {
  try {
    const {
      companyId,
      projectId,
      employeeId,
      resourceCoordinatorId,
      typeOfWork,
      startTime,
      duration: requestedDuration,
      endTime,
      taskDescription
    } = req.body;

    // Convert employeeId to array if it's not already
    const employeeIds = Array.isArray(employeeId) ? employeeId : [employeeId];

    // Fetch typeOfWork document
    const typeOfWorkDoc = await TypeOfWork.findById(typeOfWork);
    if (!typeOfWorkDoc) {
      throw new CustomError.NotFoundError('TypeOfWork not found');
    }

    // Validate resourceCoordinatorId model type (User/Admin)
    let resourceCoordinatorModel = 'User';
    let coordinator = await User.findById(resourceCoordinatorId);
    if (!coordinator) {
      coordinator = await Admin.findById(resourceCoordinatorId);
      if (!coordinator) {
        throw new CustomError.NotFoundError("User/Admin not found for resourceCoordinatorId");
      }
      resourceCoordinatorModel = 'Admin';
    }

    // Validate each employeeId and build employeeModel array
    const employeeModelArray = [];
    for (const empId of employeeIds) {
      let emp = await User.findById(empId);
      if (emp) {
        employeeModelArray.push('User');
        continue;
      }
      emp = await Admin.findById(empId);
      if (emp) {
        employeeModelArray.push('Admin');
        continue;
      }
      throw new CustomError.NotFoundError(`User/Admin not found for employeeId: ${empId}`);
    }

    // Generate a shared groupId for all these bookings
    const groupId = new mongoose.Types.ObjectId();

    // Convert startTime and endTime to Date objects (if not already)
    const start = new Date(startTime);
    let end = endTime ? new Date(endTime) : new Date(start.getTime() + requestedDuration * 60 * 60 * 1000);

    // Array to hold new booking docs
    const bookingDocs = [];

    // For each employee, create booking without overlap check
    for (let i = 0; i < employeeIds.length; i++) {
      const empId = employeeIds[i];

      bookingDocs.push(new Booking({
        companyId,
        projectId,
        employeeId: empId,
        employeeModel: employeeModelArray[i],
        resourceCoordinatorId,
        resourceCoordinatorModel,
        startTime: start,
        duration: requestedDuration,
        endTime: end,
        taskDescription,
        typeOfWork,
        typeOfWorkName: typeOfWorkDoc.name,
        groupId
      }));
    }

    // Save all bookings in parallel
    await Booking.insertMany(bookingDocs);

    // 📧 Send email to each employee
    for (let i = 0; i < employeeIds.length; i++) {
      const empId = employeeIds[i];

      let employee = await User.findById(empId);
      if (!employee) {
        employee = await Admin.findById(empId);
      }

      if (!employee || !coordinator) continue;

      const reteamnowUrl = `${config.CLIENT_URL}`;

      const emailContent = `
        <p>Hi <strong>${employee.fname} ${employee.lname}</strong>,</p>
        <p>You have been allocated to a new task/project by <strong>${coordinator.fname}</strong> (${coordinator.email}).</p>
        <h3>Resource Details:</h3>
        <ul>
          <li><strong>Coordinator Name:</strong> ${coordinator.fname} ${coordinator.lname}</li>
          <li><strong>Coordinator Email:</strong> ${coordinator.email}</li>
        </ul>
        <h3>Your Allocation:</h3>
        <ul>
          <li><strong>Task Description:</strong> ${taskDescription}</li>
          <li><strong>Start Time:</strong> ${start.toLocaleString()}</li>
          <li><strong>End Time:</strong> ${bookingDocs[i].endTime.toLocaleString()}</li>
          <li><strong>Duration:</strong> ${bookingDocs[i].duration} hour(s)</li>
          <li><strong>Type of Work:</strong> ${typeOfWorkDoc.name}</li>
        </ul>
        <p>Kindly check your calendar and ensure you're available.</p>
        <br/>
        <p>Best regards,<br/>Resource Scheduling System</p>
        <a href="${reteamnowUrl}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#ffffff;text-decoration:none;border-radius:5px;">
              Check Calendar Here
            </a>
      `;

      await sendEmail({
        email: employee.email,
        subject: "📅 New Resource Booking Notification",
        html: emailContent,
      });
    }

    res.status(201).json({
      message: ResourceAllocationMessages.BOOKING_CREATE_SUCC,
      groupId,
      bookings: bookingDocs
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking', message: err.message });
  }
};

export const checkBookingOverlap = async (req, res) => {
  try {
    const { resourceId, start, end, bookingId } = req.query;

    if (!resourceId) {
      return res.status(400).json({ error: ResourceAllocationMessages.MISSING_REQ_PARAMS });
    }

    const query = {
      employeeId: { $in: [resourceId] }, // matches resourceId inside employeeId array
      // startTime: { $lt: new Date(end) },
      // endTime: { $gt: new Date(start) }
    };

    if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(bookingId) };
    }

    const overlaps = await Booking.find(query).select('startTime endTime employeeId');

    if (overlaps.length > 0) {
      return res.status(409).json({
        message: ResourceAllocationMessages.BOOKING_TIME_OVERLAPS,
        overlaps
      });
    }

    res.status(200).json({ message: ResourceAllocationMessages.NO_OVERLAP });
  } catch (error) {
    console.error('Overlap check error:', error);
    res.status(500).json({ error: CommonMessages.INTERNAL_SERVER_ERROR });
  }
};



export const getBookingsByWorkspace = async (req, res) => {
  try {
    const { companyId } = req.params;

    const bookings = await Booking.find({ companyId })
      .populate('employeeId', 'fname lname') 
      .populate('projectId', 'name color');

    const formatted = [];

    for (const b of bookings) {
      const employees = Array.isArray(b.employeeId) ? b.employeeId : [b.employeeId];

      for (const emp of employees) {
        formatted.push({
          _id: b._id,
          startTime: b.startTime,
          endTime: b.endTime,
          duration: b.duration,
          taskDescription: b.taskDescription,
          typeOfWork: b.typeOfWork,
          employeeId: emp?._id,
          employeeName: `${emp?.fname || ''} ${emp?.lname || ''}`.trim(),
          projectId: b.projectId?._id,
          projectName: b.projectId?.name,
          projectColor: b.projectId?.color,
        });
      }
    }
    res.status(200).json(formatted);
  } catch (err) {
    console.error("Fetch bookings failed:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};



export const getIndividualUserBookings = async (req, res) => {
  try {
    const { companyId, userId } = req.params;

    // Find the user first
    const user = await User.findById(userId, 'fname lname');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find that user's bookings
    const bookings = await Booking.find({
      companyId,
      employeeId: userId,
    })
      .populate('projectId', 'name color');

    const formattedBookings = bookings.map((b) => ({
      _id: b._id,
      startTime: b.startTime,
      endTime: b.endTime,
      duration: b.duration,
      taskDescription: b.taskDescription,
      typeOfWork: b.typeOfWork,
      employeeId: user._id,
      employeeName: `${user.fname || ''} ${user.lname || ''}`.trim(),
      projectId: b.projectId?._id,
      projectName: b.projectId?.name,
      projectColor: b.projectId?.color,
    }));

    res.status(200).json({
      user: {
        id: user._id,
        name: `${user.fname || ''} ${user.lname || ''}`.trim(),
      },
      bookings: formattedBookings,
    });
  } catch (err) {
    console.error("Fetch individual user bookings failed:", err);
    res.status(500).json({ error: "Failed to fetch individual bookings" });
  }
};




export const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    await Booking.findByIdAndDelete(bookingId);
    res.status(200).json({ message: ResourceAllocationMessages.BOOKING_DEL });
  } catch (err) {
    console.error("Delete booking failed:", err);
    res.status(500).json({ error: "Failed to delete booking" });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('projectId','name')
      .populate('employeeId','fname lname')
      .populate('typeOfWork','name')
      .lean();
    if (!booking) return res.status(404).json({ message: ResourceAllocationMessages.BOOKING_NOT_FOUND });

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBookingWithHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const currentBooking = await Booking.findById(id);
    
    if (!currentBooking) return res.status(404).json({ message: ResourceAllocationMessages.BOOKING_NOT_FOUND });

    const data = Array.isArray(req.body) ? req.body[0] : req.body;
    const updatedBooking = await Booking.findByIdAndUpdate(id,   { $set: data }, {
      new: true,
    });

    await bookingHistory.create({
      bookingId: id,
      updatedAt: new Date(),
      oldData: currentBooking.toObject(),
      newData: data,
    });

    res.status(200).json(updatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


export const updateBookingTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, duration } = req.body;

    const updated = await Booking.findByIdAndUpdate(
      id,
      {
        startTime,
        endTime,
        duration,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: ResourceAllocationMessages.BOOKING_NOT_FOUND });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating booking time:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};