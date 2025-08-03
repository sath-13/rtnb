import mongoose from "mongoose";
import { modifiedByModel_ROLES } from "../constants/enums.js";

const historySchema = new mongoose.Schema(
  {
    actionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Action",
      required: true,
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "modifiedByModel",
    },
    modifiedByModel: {
      type: String,
      required: true,
      enum: Object.values(modifiedByModel_ROLES), // Using USER_ROLES from enums
    },
    modifiedByName: { type: String, required: true },
    changes: {
      type: [
        {
          field: { type: String, required: true },
          oldValue: { type: mongoose.Schema.Types.Mixed, required: true },
          newValue: { type: mongoose.Schema.Types.Mixed, required: true },
        },
      ],
      required: true,
    },
  },
  { timestamps: true }
);

const History = mongoose.model("History", historySchema);
export default History;
