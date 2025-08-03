
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  category: { type: String },
  questionType: { type: String },
  comment: { type: String },
  skipped: { type: Boolean, default: false },
  submitAnonymously: { type: Boolean, default: false }
},{ _id: false });

const surveySchema = new mongoose.Schema({
  sid: { type: String, required: true, unique: true },
  survey: {
    title: String,
    description: String,
    category: mongoose.Schema.Types.Mixed,
    audience: String,
    dueDate: String
  },
   workspace: { type: String, required: true },
  questions: [questionSchema]
});

const Survey = mongoose.model("Survey", surveySchema);
export default Survey;
