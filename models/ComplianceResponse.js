import mongoose from "mongoose";

const complianceResponseSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  testId: { type: String, required: true }, // Corresponds to the 'sid' of the ComplianceTest
  answers: { type: mongoose.Schema.Types.Mixed }, // Stores { questionId: "selected answer" }
  score: { type: Number, required: true },
  status: { type: String, enum: ['Pass', 'Fail'], required: true },
  timeSpent: { type: Number, default: 0 }, // Time spent in minutes
  submittedAt: { type: Date, default: Date.now },
});

const ComplianceResponse = mongoose.model("ComplianceResponse", complianceResponseSchema);
export default ComplianceResponse;