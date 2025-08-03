import mongoose from 'mongoose';

const bookingHistorySchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  updatedAt: { type: Date, default: Date.now },
  oldData: { type: Object,default: null, },
  newData: { type: Object,default: null,},
});

const bookingHistory =  mongoose.model('ResourceAllocationHistory', bookingHistorySchema);
export default bookingHistory;