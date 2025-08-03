import mongoose from "mongoose";

const streamSchema = mongoose.Schema(
  {
    streamTitle: {
      type: String,
      required: true,
  },
  workspaceName: { type: String },
  },
  { timestamps: true }
);

const Streams = mongoose.model("Streams", streamSchema);

export default Streams;
