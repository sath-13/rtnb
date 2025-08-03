import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    remindAt: { type: Date, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Domain", required: true }, // Refers to Domain model
    userId: { type: String, required: true }, // just store user/admin ID as string
    icon: { type: String, default: "FaRegBell" },
  },
  { timestamps: true }
);

const Reminder = mongoose.model('Reminder', reminderSchema);
export default Reminder;
