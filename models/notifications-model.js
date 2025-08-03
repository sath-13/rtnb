import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actionId: { type: mongoose.Schema.Types.ObjectId, ref: "Action" }, // Made optional for survey notifications
    actionTitle: { type: String, required: true },
    description: { type: String, required: true },
    CreatedByName: { type: String, required: true },
    CreatedBy: { type: String, required: true },
    userAssigned: { type: String, required: true },
    userAssignedName: { type: String, required: true },
    subAssigned: {  
      type: [String],
      default:[],
    },
    read: { type: Boolean, default: false },
    // 🆕 New fields for survey notifications
    notificationType: { type: String, enum: ['action', 'survey_launch', 'comment_reply'], default: 'action' },
    surveyId: { type: String }, // Store survey ID for survey-related notifications
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
