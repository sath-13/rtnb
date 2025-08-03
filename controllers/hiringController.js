import HiringRequest from "../models/Hiring-model.js"
import User from "../models/user-model.js";


export const submitHiringRequest = async (req, res) => {
  const data = req.body;

  if (!data.name || !data.location || !data.podName || !data.designation) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    if (data.userId) {
      const user = await User.findById(data.userId);
      if (user) {
        data.assignedToUserId = user._id;
        delete data.jobRole; // ignore jobRole if sending to particular user
      }
    }

    const newRequest = new HiringRequest(data);
    await newRequest.save();
    res.status(201).json({ message: "Hiring request saved successfully" });
  } catch (error) {
    console.error("Error saving hiring request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getAllHiringRequests = async (req, res) => {
  const userJobRole = req.query.jobRole;
  const userId = req.query.userId;
  try {
    let query = {};
    if (userJobRole !== 'superadmin') {
      query = {
        $or: [
          { jobRole: userJobRole },
        { assignedToUserId: userId }
        ]
      };
    }
    const hiringRequests = await HiringRequest.find(query).sort({ createdAt: -1 });
    res.json(hiringRequests);
  } catch (err) {
    console.error("Error fetching hiring requests:", err);
    res.status(500).json({ error: "Failed to fetch hiring requests" });
  }
};



export const makeDecision = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  if (!['accepted', 'rejected'].includes(status) || !reason) {
    return res.status(400).json({ error: 'Provide valid status and reason' });
  }
  try {
    const updated = await HiringRequest.findByIdAndUpdate(
      id,
      {
        decisionStatus: status,
        decisionReason: reason,
        decisionDate: new Date()
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Decision saved', updated });
  } catch (err) {
    console.error('Error saving decision', err);
    res.status(500).json({ error: 'Server error' });
  }
};
// controller
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'fname');  
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await HiringRequest.findById(req.params.id);
    console.log("Found job:", job);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  } catch (err) {
    console.error("Error fetching job by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUsersInWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    if (!workspaceId) {
      return res.status(400).json({ msg: "Workspace ID is required" });
    }

    const users = await User.find({ workspace: workspaceId }).select("fname lname email _id"); // Adjust fields as needed

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users in workspace:", error);
    return res.status(500).json({ msg: "Server error while fetching users" });
  }
};
