import mongoose from 'mongoose';

const AccessMatrixHistorySchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userInfo: {
    fname: String,
    lname: String,
    email: String,
    username: String,
  },
  changes: {
    type: Object,
    required: true,
  },
  previousMatrix: {
    type: Object,
  },
  newMatrix: {
    type: Object,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const AccessMatrixHistory = mongoose.model('AccessMatrixHistory', AccessMatrixHistorySchema);
export default AccessMatrixHistory;
