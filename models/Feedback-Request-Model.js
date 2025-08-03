import mongoose from "mongoose";

const FeedbackRequestSchema = new mongoose.Schema({
  reviewerId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID of the reviewer
  revieweeId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID of the reviewee
  workspacename: { type: String, required: true }, // Workspace name where feedback is being requested
  requesterId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID of the person who made the request
  status: { type: String, enum: ["pending", "completed"], default: "pending" }, // Feedback status
  createdAt: { type: Date, default: Date.now }, // Timestamp for when the request was created
});

const FeedbackRequest = mongoose.model("FeedbackRequest", FeedbackRequestSchema);
export default FeedbackRequest;
