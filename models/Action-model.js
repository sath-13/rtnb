// action-model.js
import mongoose from 'mongoose';
import Teams from './team-model.js';
import { ACTION_STATUS, ACTION_PRIORITY } from '../constants/enums.js';

const actionSchema = new mongoose.Schema(
  {
    actionTitle: { type: String, required: true },
    description: { type: String, required: true },
    userAssigned: { type: String },
    workspaceName: { type: String },
    stream: { type: String, required: true },
    subStreams: { type: [String], default: [] },
    status: { type: String, enum: Object.values(ACTION_STATUS), default: ACTION_STATUS.PENDING },
    priority: { type: String, enum: Object.values(ACTION_PRIORITY) },
    CreatedBy: { type: String },
    userAssignedName: { type: String },
    CreatedByName: { type: String },
    subAssigned: { type: [String], default: [] },
    files: { type: [String], default: [] }, // Store multiple file paths
    createdDate: { type: Date, default: Date.now }, // Default to current time
    expectedCompletionDate: { type: Date }, // User-defined
  },
  { timestamps: true }
);

actionSchema.statics.findAssociatedTeams = async function (workspaceName, stream, subStreams) {
  if (!subStreams || subStreams.length === 0) {
    return await Teams.find({ workspaceName, stream });
  } else {
    return await Teams.find({
      workspaceName,
      stream,
      subStreams: { $in: subStreams },
    });
  }
};

const Action = mongoose.model('Action', actionSchema);
export default Action;
