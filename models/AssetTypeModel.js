import mongoose from 'mongoose';

const AssetTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssetCategory' },
  assetCount: { type: Number, default: 0 },
});

export default mongoose.model('AssetType', AssetTypeSchema);
