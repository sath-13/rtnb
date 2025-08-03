import mongoose from "mongoose";

const AssignedBadgeSchema = new mongoose.Schema({
    badge: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge', required: true }, 
    assigned_by: { type: mongoose.Schema.Types.ObjectId, required: true }, 
    assigned_to: { type: mongoose.Schema.Types.ObjectId, required: true }, 
    description: { type: String },  
    workspacename: { type: String },
    assigned_at: { type: Date, default: Date.now },  
    visibility: { type: String, enum: ['in_person', 'in_team', 'public'], default: 'in_person' }, 
    team: { type: String, default: "No Team" } 
});

const AssignedBadge = mongoose.model("AssignedBadge", AssignedBadgeSchema);
export default AssignedBadge;
