import mongoose from "mongoose";
import { PRODUCT_STATUS, ASSIGNED_BY_MODEL } from "../constants/enums.js";
import Company from "./Company-Model.js"; // Import Company model for validation

const assignedProductSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'userModel', //  dynamic model reference
    },
    userModel: {
      type: String,
      required: true,
      enum: ['User', 'Admin'], //  allowed models
    },    
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.ACTIVE,
    },
    workspacename: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "assignedByModel",
      required: true,
    },
    assignedByModel: {
      type: String,
      required: true,
      enum: Object.values(ASSIGNED_BY_MODEL),
    },
  },
  { timestamps: true }
);

const AssignedProduct = mongoose.model("AssignedProduct", assignedProductSchema);
export default AssignedProduct;
