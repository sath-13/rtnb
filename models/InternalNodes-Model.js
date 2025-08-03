import mongoose from "mongoose";

const internalNodeSchema = new mongoose.Schema(
  {
    givenTo: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    givenBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    workspacename: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const InternalNode = mongoose.model("InternalNode", internalNodeSchema);

export default InternalNode;
