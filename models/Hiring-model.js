import mongoose from "mongoose";

const HiringRequestSchema = new mongoose.Schema({
  name: String,
  location: String,
  podName: String,
  designation: String,
  vacancies: Number,
  positionType: String,
  experience: String,
  reason: String,
  shift: String,
  candidateProfile: String,
  filledBy: String,
  comments: String,
  jobRole: { 
      type: String, 
      default: ''        
    },
      assignedToUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  decisionStatus: { type: String, enum: ['accepted', 'rejected'], default: null },
  decisionReason: { type: String, default: null },
  decisionDate: { type: Date },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("HiringRequest", HiringRequestSchema);
