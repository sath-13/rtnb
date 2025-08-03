import mongoose from "mongoose";

const ProjectAllocationHistorySchema = new Schema({
user_id: {
 type: String, // storing ObjectId as string temporarily
 required: true,
 },
 date: {
 type: Date,
 required: true,
 },
 changed_by: {
 type: String,  // storing ObjectId as string temporarily
 required: true,
 },
 change_note: {
 type: String,
 required: true,
 },
 changed_at: {
 type: Date,
 default: Date.now,
 },
});

const ProjectAllocationHistory = mongoose.model("ProjectAllocationHistory", ProjectAllocationHistorySchema);
export default ProjectAllocationHistory;