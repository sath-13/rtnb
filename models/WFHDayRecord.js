import mongoose from 'mongoose';

const wfhDayRecordSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  name: { type: String }, // Add name field
  date: { type: Date, required: true },
  weekday: { type: String }, // Add weekday field
  wfhType: { type: String, required: true },
}, { timestamps: true });

const WFHDayRecord = mongoose.model('WFHDayRecord', wfhDayRecordSchema);
export default WFHDayRecord;
