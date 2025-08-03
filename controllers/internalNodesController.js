import InternalNode from "../models/InternalNodes-Model.js";
import User from "../models/user-model.js";
import Admin from "../models/SuperAdmin-model.js";

/**
 * Create a new internal node
 */
export const createInternalNode = async (req, res) => {
  try {
    const { givenTo, givenBy, description, workspacename } = req.body;

    if (!givenTo || !givenBy || !description || !workspacename) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newNode = await InternalNode.create({
      givenTo,
      givenBy,
      description,
      workspacename,
    });

    res.status(201).json(newNode);
  } catch (error) {
    console.error("Error creating internal node:", error);
    res.status(500).json({ message: "Server error" });
  }
};




export const getInternalNodesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const internalNodes = await InternalNode.find({ givenTo: userId }).sort({ createdAt: -1 });

    const enrichedNodes = await Promise.all(
      internalNodes.map(async (node) => {
        // Look up givenBy in both User and Admin
        const [givenByUser, givenByAdmin] = await Promise.all([
          User.findById(node.givenBy).select("fname lname"),
          Admin.findById(node.givenBy).select("fname lname"),
        ]);

        // Look up givenTo in both User and Admin
        const [givenToUser, givenToAdmin] = await Promise.all([
          User.findById(node.givenTo).select("fname lname"),
          Admin.findById(node.givenTo).select("fname lname"),
        ]);

        const givenByName =
          (givenByUser ? `${givenByUser.fname} ${givenByUser.lname}` : givenByAdmin ? `${givenByAdmin.fname} ${givenByAdmin.lname}` : "Unknown");

        const givenToName =
          (givenToUser ? `${givenToUser.fname} ${givenToUser.lname}` : givenToAdmin ? `${givenToAdmin.fname} ${givenToAdmin.lname}` : "Unknown");

        return {
          ...node.toObject(),
          givenByName,
          givenToName,
        };
      })
    );

    res.status(200).json(enrichedNodes);
  } catch (error) {
    console.error("Error fetching internal nodes:", error);
    res.status(500).json({ message: "Server error" });
  }
};
