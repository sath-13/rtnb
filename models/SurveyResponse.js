// models/SurveyResponse.js
import mongoose from 'mongoose';

// Each individual answer
const AnswerSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  questionType: {
    type: String,
    required: true,
    enum: ['emoji-scale', 'slider', 'toggle', 'star-rating', 'radio-group', 'checkbox-group', 'open-ended'],
    trim: true,
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // Number, String, Boolean, or Array
    required: function () {
      return !this.skipped;
    },
  },
  comments: {
    type: String,
    trim: true,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  skipped: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

// Response by a user
const EmployeeResponseSchema = new mongoose.Schema({
  empId: {
    type: String,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  answers: {
    type: [AnswerSchema],
    required: true,
  }
}, { _id: false });

// Main survey response
const SurveyResponseSchema = new mongoose.Schema({
  sid: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  title: {
    type: String,
    trim: true,
  },
  workspace: {
    type: String,
    required: true,
    trim: true,
  },
  audienceType: {
    type: String,
    enum: ['all-employees', 'department', 'team', 'managers'],
    default: 'all-employees',
  },
  responses: {
    type: [EmployeeResponseSchema],
    default: [],
  },
}, { timestamps: true, collection: 'SurveyResponse' });

const SurveyResponse = mongoose.model('SurveyResponse', SurveyResponseSchema);
export default SurveyResponse;
