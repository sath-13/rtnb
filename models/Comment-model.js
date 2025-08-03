import mongoose from 'mongoose';
import { createdByModel_ROLES } from '../constants/enums.js';

const commentSchema = new mongoose.Schema(
  {
    actionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Action",
      required: true,
    },
    workspaceName: { type: String, required: true },
    description: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "createdByModel",
    },
    createdByModel: {
      type: String,
      required: true,
      enum: Object.values(createdByModel_ROLES), // Using USER_ROLES from enums
    },
    createdByName: {
      type: String,
      required: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
