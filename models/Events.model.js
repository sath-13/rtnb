import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAttending: {
    type: Boolean,
    required: true
  }
}, { _id: false });

export { attendanceSchema };

const sessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
   status: {
    type: String,
    enum: ["active", "completed", "cancelled"],
    default: "active",
  },
  cancelReason: {
  type: String,
  default: "",
},
  location: { type: String },
  file: { type: String },
  reminder: { type: Date },

  description: String,
  userAssigned: [mongoose.Schema.Types.ObjectId] ,
  sessions: [sessionSchema], 
  attendance: [attendanceSchema]
}, {
  timestamps: true
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
