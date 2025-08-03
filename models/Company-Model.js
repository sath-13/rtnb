import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
{
  company_id:
  {
    type: String,
    required: true,
    },
   name: {
   type: String,
   required: true,
   trim: true,
   },
   url: {
   type: String,
   required: true,
   trim: true,
  },
  linkedin: {
  type: String,
  required: true,
  trim: true,
  },
  address: {
  type: String,
  required: true,
  trim: true,
  },
  branches: {
    type: [String],
    default: [],
  },
   working_hours: {
     from: {
        type: String, // Example: "09:00"
        required: true,
     },
     to: {
        type: String, // Example: "21:00"
        required: true,
      },
    },
    working_days: {
      type: [String], // Example: ["Monday", "Tuesday", ..., "Saturday"]
      default: [],
    },
    working_hours_per_day: {
      type: String,
      required: true,
      },
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", companySchema);
export default Company;