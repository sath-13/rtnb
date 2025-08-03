import CustomError from "../errors/index.js";
import AssetAcknowledgement from "../models/AssetAcknowledgment-model.js";
import { StatusCodes } from "http-status-codes";
import Product from "../models/product-model.js";
import AssignedProduct from "../models/assignedProduct-model.js";
import User from "../models/user-model.js";
import Admin from "../models/SuperAdmin-model.js";

// In acceptAcknowledgement.js
export const acceptAcknowledgement = async (req, res) => {
  const { id } = req.params;

  const acknowledgement = await AssetAcknowledgement.findById(id)
    .populate("product")
    .populate("assignedBy");

  if (!acknowledgement) {
    throw new CustomError.NotFoundError('Acknowledgement not found');
  }

  if (acknowledgement.status !== "pending") {
    throw new CustomError.BadRequestError('This acknowledgement has already been processed');
  }

  acknowledgement.status = 'accepted';
  acknowledgement.responseDate = new Date();
  await acknowledgement.save();

  await Product.findByIdAndUpdate(acknowledgement.product._id, {
    tag: 'assigned',
    assetStatus: 'assigned',
  });

  let userModel = "User";
  const user = await User.findById(acknowledgement.user);
  if (!user) {
    const admin = await Admin.findById(acknowledgement.user);
    if (!admin) {
      throw new CustomError.NotFoundError("User/Admin who accepted acknowledgement not found");
    }
    userModel = "Admin";
  }

  // Use populated assignedBy values
  const assignedBy = acknowledgement.assignedBy._id;
  const assignedByModel = acknowledgement.assignedByModel;

  await AssignedProduct.create({
    user: acknowledgement.user,
    userModel,
    product: acknowledgement.product._id,
    acknowledgement: acknowledgement._id,
    assignedOn: new Date(),
    workspacename: acknowledgement.workspacename,
    description: acknowledgement.description,
    assignedBy,
    assignedByModel
  });

  res.status(StatusCodes.OK).send(`
    <h2>✅ Asset Accepted Successfully!</h2>
    <p>The asset has been successfully assigned. You may close this page.</p>
  `);
};




export const declineAcknowledgement = async (req, res) => {
  const { id } = req.params;

  // Find the asset acknowledgement by ID
  const acknowledgement = await AssetAcknowledgement.findById(id).populate("product");

  if (!acknowledgement) {
    throw new CustomError.NotFoundError('Acknowledgement not found');
  }

  if (acknowledgement.status !== "pending") {
    throw new CustomError.BadRequestError('This acknowledgement has already been processed');
  }

  // Change status to declined
  acknowledgement.status = 'declined';
  acknowledgement.responseDate = new Date();
  await acknowledgement.save();

  // Unassign product (if necessary, optional)
  await Product.findByIdAndUpdate(acknowledgement.product._id, {
    tag: 'notassigned',
    assetStatus: 'available', // or any other status for free assets
  });

  res.status(StatusCodes.OK).send(`
    <h2>❌ Asset Declined Successfully!</h2>
    <p>The asset has been unassigned. You may close this page.</p>
  `);
};



export const getAllAssetAcknowledgements = async (req, res) => {
    try {
      const acknowledgements = await AssetAcknowledgement.find()
        .populate("user", "email fname lname branch")
        .populate("product", "accessoriesName productTypeName");
  
      const formatted = acknowledgements.map((item) => ({
        id: item._id,
        email: item.user.email,
        firstName: item.user.fname,
        lastName: item.user.lname,
        branch: item.user.branch,
        accessoriesName: item.product.accessoriesName,
        productTypeName: item.product.productTypeName,
        status: item.status,
        requestDate: item.requestDate,
        responseDate: item.responseDate || "--",
      }));
  
      res.status(StatusCodes.OK).json({ acknowledgements: formatted });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error fetching acknowledgements" });
    }
  };
  
  export const getAssetAcknowledgementById = async (req, res) => {
    const { id } = req.params;
  
    try {
      const acknowledgement = await AssetAcknowledgement.findById(id)
        .populate("user", "email fname lname branch")
        .populate("product", "accessoriesName productTypeName");
  
      if (!acknowledgement) {
        return res.status(StatusCodes.NOT_FOUND).json({ msg: "Acknowledgement not found" });
      }
  
      // Format the data similar to getAllAssetAcknowledgements
      const formatted = {
        id: acknowledgement._id,
        email: acknowledgement.user.email,
        firstName: acknowledgement.user.fname,
        lastName: acknowledgement.user.lname,
        branch: acknowledgement.user.branch,
        accessoriesName: acknowledgement.product.accessoriesName,
        productTypeName: acknowledgement.product.productTypeName,
        status: acknowledgement.status,
        requestDate: acknowledgement.requestDate,
        responseDate: acknowledgement.responseDate || "--",
      };
  
      res.status(StatusCodes.OK).json({ acknowledgement: formatted });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error fetching acknowledgement" });
    }
  };
  
  