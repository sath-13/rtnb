import mongoose from "mongoose";

const AssetAcknowledgementSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    status: { 
      type: String, 
      enum: ["pending", "accepted", "declined"], 
      default: "pending" 
    },
    requestDate: { type: Date, default: Date.now },
    responseDate: { type: Date }, // date when accepted/declined

    // New fields
    assignedBy: { type: mongoose.Schema.Types.ObjectId, refPath: "assignedByModel", required: true },
    assignedByModel: { type: String, enum: ["User", "Admin"], required: true },

    workspacename: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("AssetAcknowledgement", AssetAcknowledgementSchema);
