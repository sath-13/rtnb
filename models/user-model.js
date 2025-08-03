import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { USER_ROLES, USER_STATUS, BRANCHES, UserMessages } from '../constants/enums.js';

dotenv.config();

const userSchema = new mongoose.Schema(
  {
    fname: { type: String, required: true, maxlength: 50 },
    lname: { type: String, required: true, maxlength: 50 },
    username: { type: String, required: true, maxlength: 50, minlength: 3, unique: true },
    password: { type: String },
    email: {
      type: String,
      required: true,
      index: false,
      validate: { validator: validator.isEmail, message: UserMessages.PROVIDE_VALID_EMAIL },
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.INACTIVE,
    },
    role: {
      type: String,
      default: 'user',
    },
    teamTitle: { type: [String], default: [] },
    workspaceName: { type: [String], default: [] },
    userLogo: { type: String, default: "" },
    branch: { type: String },

    companyId: { 
      type: String,    
    },

    jobRole: { 
      type: String, 
      default: ''        
    },
    isAttending: { type: Boolean, default: false },
    

    resetPasswordToken: String,
    resetPasswordExpire: Date,
    resetTokenRaw: String, // Raw token for password reset links
    imported: { type: Boolean, default: false },

    directManager: { type: String, default: null },
    dottedLineManager: { type: String, default: null },
  },
  { 
    timestamps: true,
    autoIndex: true
  }
);

// Password hashing before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.email = this.email.toLowerCase();
  this.username = this.username.toLowerCase();
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (userPassword) {
  return await bcrypt.compare(userPassword, this.password);
};

// Method to generate JWT
userSchema.methods.createJWT = function () {
  return jwt.sign(
    {
      userId: this._id,
      email: this.email,
      role: this.role,
      branch: this.branch,
      fname: this.fname,
      lname: this.lname,
      workspaceNames: this.workspaceName,
      teamTitles: this.teamTitle,
      companyId: this.companyId,    
      jobRole: this.jobRole         
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const User = mongoose.model('User', userSchema);
export default User;
