import mongoose from 'mongoose';

const AssetCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
});

export default mongoose.model('AssetCategory', AssetCategorySchema);
