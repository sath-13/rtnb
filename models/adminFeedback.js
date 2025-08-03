import mongoose from "mongoose";

const AdminReplySchema = new mongoose.Schema({
  surveyId: { type: String, required: true, index: true },
  questionId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  commentUniqueId: { type: String, required: true, unique: true, index: true }, // Key for linking to specific comment
  adminId: { type: String, required: true },
  adminName: { type: String, required: true },
  // Option 1: Store individual reply. If multiple replies, each is a separate document.
  replyText: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  lastEditedAt: { type: Date },
});

const AdminReply = mongoose.model("AdminReply", AdminReplySchema);
export default AdminReply;
