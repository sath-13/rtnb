import mongoose from 'mongoose';
// SubStream schema
const subStreamSchema = new mongoose.Schema(
  {
    subStreamTitle: {
      type: String,
      required: [true, 'Please provide substream name'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    streamTitle: {
      type: String,
    },
    workspacename: {
      type: String,
    },
  },
  { timestamps: true }
);

// Export the SubStream model
const SubStream = mongoose.model('SubStream', subStreamSchema);
export default SubStream;
