import User from "../models/user-model.js";
import Admin from "../models/SuperAdmin-model.js";
import Post from "../models/Post-model.js";
import { FeedMessages } from "../constants/enums.js";

export const createPost = async (req, res) => {
  try {
    const { content, target, workspacename, teamname } = req.body;
    const userId = req.user.id; // Assumed set by middleware

    let creatorModel = null;
    let creatorDoc = await User.findById(userId);

    if (creatorDoc) {
      creatorModel = "User";
    } else {
      creatorDoc = await Admin.findById(userId);
      if (creatorDoc) {
        creatorModel = "Admin";
      }
    }

    if (!creatorModel) {
      return res.status(401).json({ error: FeedMessages.INVALID_ID });
    }

    const newPost = new Post({
      content,
      target,
      workspacename,
      teamname: target === "team" ? teamname : undefined,
      createdBy: userId,
      creatorModel,
    });

    await newPost.save();
    res.status(201).json({ message: FeedMessages.POST_CREATE_SUCC, post: newPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: FeedMessages.POST_CREATE_FAIL });
  }
};



export const getWorkspacePosts = async (req, res) => {
  try {
    const { workspaceName } = req.params;

    const posts = await Post.find({ workspacename: workspaceName })
      .sort({ createdAt: -1 })
      .populate({
        path: "createdBy",
        select: "fname lname userLogo"
      });

    res.status(200).json(posts);
  } catch (err) {
    console.error(FeedMessages.WORKSPACE_POSTS_FETCH_ERR, err);
    res.status(500).json({ error: FeedMessages.WORKSPACE_POSTS_FETCH_FAIL });
  }
};

export const getTeamPosts = async (req, res) => {
  try {
    const { teamname } = req.params;

    const posts = await Post.find({ teamname })
      .sort({ createdAt: -1 })
      .populate({
        path: "createdBy",
        select: "fname lname userLogo"
      });

    res.status(200).json(posts);
  } catch (err) {
    console.error(FeedMessages.TEAM_POSTS_FETCH_ERR, err);
    res.status(500).json({ error: FeedMessages.TEAM_POSTS_FETCH_FAIL });
  }
};
