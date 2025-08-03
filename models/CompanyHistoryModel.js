import mongoose from 'mongoose';

const companyHistorySchema = new mongoose.Schema({
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'changedByModel',
  },
  changedByModel: {
    type: String,
    required: true,
    enum: ['User', 'Admin'],
  },
  changedAt: { type: Date, default: Date.now },
  changes: {
    working_hours: {
      old: { from: String, to: String },
      new: { from: String, to: String },
    },
    working_days: {
      old: [String],
      new: [String],
    },
    working_hours_per_day: {
      old: String,
      new: String,
    },
  },
});

const CompanyHistory = mongoose.model('CompanyHistory', companyHistorySchema);
export default CompanyHistory;
