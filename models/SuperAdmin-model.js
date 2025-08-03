import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Company from "./Company-Model.js"; // Import Company model
import { USER_STATUS } from "../constants/enums.js";

const AdminSchema = new mongoose.Schema(
  {
    fname: {
      type: String,
      required: [true, "Please provide first name"],
      maxlength: 50,
      minlength: 3,
    },
    lname: {
      type: String,
      required: [true, "Please provide last name"],
      maxlength: 50,
      minlength: 3,
    },
    username: {
      type: String,
      required: [true, "Please provide a username"],
      maxlength: 50,
      minlength: 3,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: { 
      type: String, 
      required: true 
    },

    // New fields as arrays
    workspaceName: {
      type: [String],
      default: [],
    },
    teamTitle: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      default: USER_STATUS.ACTIVE, // Using ENUM
    },
    userLogo: {
      type: String,
      default: "",
    },

    branch: {
      type: String,
    },
    createdAt: { type: Date, default: Date.now },
    role: { type: String, default: "superadmin" },

    // Job role within the company (e.g., Software Engineer, Manager, CTO)
    jobRole: {
      type: String,
     
    },

    // New fields
    companyId: { 
      type: String, 
      ref: "Domain",  
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    resetTokenRaw: String, // Raw token for password reset links
    
    directManager: { 
      type: String, 
      default: null, // Direct manager (optional)
    },
    dottedLineManager: { 
      type: String, 
      default: null, // Dotted line manager (optional)
    },
  },
  { timestamps: true }
);

// Hash password before saving
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
AdminSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const Admin = mongoose.model("Admin", AdminSchema);
export default Admin;
