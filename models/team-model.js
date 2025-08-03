import mongoose from "mongoose";
import User from "./user-model.js";
import Admin from "./SuperAdmin-model.js";

const teamSchema = mongoose.Schema(
  {
    teamTitle: {
      type: String,
      required: true,
    },
    workspaceName: {
      type: String,
      required: true,
    },
    teamDescriptions: {
      type: String,
      //required: true,
    },
    stream: {
      type: String,
      //required: true,
    },
    subStreams: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Static method to find users in associated teams
teamSchema.statics.findUsersInTeams = async function (teamTitles, workspaceName) {
  const userResults = await User.find({
    teamTitle: { $in: teamTitles },
    workspaceName: workspaceName,
  }).select("_id username email");

  const adminResults = await Admin.find({
    teamTitle: { $in: teamTitles },
    workspaceName: { $in: [workspaceName] },
  }).select("_id name email");

  return [...userResults, ...adminResults];
};

const Teams = mongoose.model("Teams", teamSchema);

export default Teams;
