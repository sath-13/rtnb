import express from 'express';
import { createBooking,checkBookingOverlap,getBookingsByWorkspace ,deleteBooking,getBookingById,updateBookingWithHistory, createProject ,updateBookingTime} from '../controllers/ResourceAllocationController.js';

const router = express.Router();

// Booking-related routes
router.post('/create', createBooking);
router.get('/:companyId', getBookingsByWorkspace);
router.delete('/:bookingId', deleteBooking);
router.get('/bookingId/:id', getBookingById);
router.put('/:id', updateBookingWithHistory);
router.post('/createProject', createProject);
router.patch('/booking/:id', updateBookingTime);
router.get('/check/overlap', checkBookingOverlap);

export default router;
