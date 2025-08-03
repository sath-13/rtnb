import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  answer: { type: String, required: true }, // The correct answer is stored here
  required: { type: Boolean, default: true },
});

const complianceTestSchema = new mongoose.Schema({
  sid: { type: String, required: true, unique: true },
  test: {
    title: { type: String, required: true },
    description: { type: String },
    driveFileNames: { type: String },
    numQuestions: { type: Number },
    audience: { type: String, required: true },
    dueDate: { type: String, required: true },
  },
  questions: [questionSchema],
  workspacename: { type: String, required: true }, // Add workspace field
  createdAt: { type: Date, default: Date.now },
});

const ComplianceTest = mongoose.model("ComplianceTest", complianceTestSchema);
export default ComplianceTest;