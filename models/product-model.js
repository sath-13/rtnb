import mongoose from "mongoose";
import Company from "./Company-Model.js"; 

const productSchema = new mongoose.Schema(
  {
    branch: {
      type: String,
      required: [true, "Please provide a branch name"],
      default: 'Goa',
      validate: {
        validator: async function (value) {
          const companies = await Company.find({}, "branches"); // Fetch all branches
          const allBranches = companies.flatMap((company) => company.branches);
          return allBranches.includes(value);
        },
        message: "Invalid branch name",
      },
    },
    dateOfPurchase: {
      type: Date,
      default: Date.now(),
    },
    productCategory: {
      type: mongoose.Schema.Types.ObjectId, // Reference to AssetCategory
      ref: "AssetCategory",
      required: true,
    },
    productCategoryName:{
      type: String,
    },
    productType: {
      type: String,
      trim: true,
      required: true,
    },
    productTypeName:{
      type: String,
      trim: true,
      required: true,
    },
    warrantyPeriod: {
      type: String,
      trim: true,
    },
    systemModel: {
      type: String,
      trim: true,
    },
    systemBrand: {
      type: String,
      trim: true,
    },
    cpu: {
      type: String,
      trim: true,
    },
    ram: {
      type: String,
      trim: true,
    },
    storageType: {
      type: String,
      trim: true,
    },
    storageCapacity: {
      type: String,
      trim: true,
    },
    os: {
      type: String,
      trim: true,
    },
    macAddress: {
      type: String,
      trim: true,
    },
    productKey: {
      type: String,
      trim: true,
    },
    serialNumber: {
      type: String,
      trim: true,
    },
    accessoriesName: {
      type: String,
      trim: true,
    },
    assetImage: {
      type: String,
      trim: true,
    },
    assetDocument: {
      type: String, 
      trim: true,
    },
    assetCondition: {
      type: String,
      enum: ["Excellent", "Good", "Fair", "Poor"],
      required: true,
    },
    assetStatus: {
      type: String,
      enum: ["Available", "Assigned", "Not Available"],
      required: true,
    },
    assetDescription: {
      type: String,
    },    
    networkDeviceName: {
      type: String,
      trim: true,
    },
    workspacename: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
      required: true,
      enum: {
        values: ["assigned", "notassigned"],
        message: "{VALUE} not supported",
      },
      default: "notassigned",
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
