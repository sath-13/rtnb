//Storing deatils of Requested Feedback 
//Schema for storing Requested Feedback
import mongoose from "mongoose"; 

const RequestFeedbackSchema = new mongoose.Schema(
  {
    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    feedbackType: {
      type: String,
      enum: ["request", "direct", "anonymous"],
      default: "request",
    },
    workspacename: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const StoreRequestedFeedback = mongoose.model("RequestFeedback", RequestFeedbackSchema);

export default StoreRequestedFeedback;
