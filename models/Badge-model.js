// models/Badge-model.js
import mongoose from 'mongoose';

const BadgeSchema = new mongoose.Schema({
    name: { type: String, required: true },  // Badge name (e.g., "Top Contributor")
    type: { type: String, required: true },  // Type of badge (e.g., "Achievement")
    icon: { type: String, required: true },  // URL or file path of badge icon
    workspaceNames: { type: [String], default: [] }, // This can store an array of workspace names
    createdBy: { type: String, required: true }, // User who created the badge
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const Badge = mongoose.model('Badge', BadgeSchema);
export default Badge;
