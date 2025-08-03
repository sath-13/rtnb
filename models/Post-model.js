import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  target: { type: String, enum: ["workspace", "team"], default: "workspace" },
  workspacename: { type: String, required: true },
  teamname: { type: String },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'creatorModel',
    required: true
  },
  creatorModel: {
    type: String,
    enum: ['User', 'Admin'], // adjust if your models are named differently
    required: true
  }
}, { timestamps: true });

const Post = mongoose.model("Post", postSchema);
export default Post;
