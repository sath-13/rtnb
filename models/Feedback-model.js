import mongoose from "mongoose";
//Schema for when giving direct feedback
// Store Direct Feedback  
const FeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    givenBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: function () {
        return this.feedbackType === "direct";
      },
    },
    description: {
      type: String,
      required: true,
    },
    workspacename: {
      type: String,
      required: true,
    },
    feedbackType: {
      type: String,
      enum: ["anonymous", "direct", "request"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model("Feedback", FeedbackSchema);
export default Feedback;
