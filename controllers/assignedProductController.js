import AssignedProduct from "../models/assignedProduct-model.js";
import User from "../models/user-model.js";
import Admin from "../models/SuperAdmin-model.js";
import Product from "../models/product-model.js";
import { StatusCodes } from "http-status-codes";
import CustomError from "../errors/index.js";
import checkPermission from "../utils/checkPermission.js";
import { ProductMessages } from "../constants/enums.js";
import sendEmail from "../utils/sendEmail.js"; 
import AssetAcknowledgement from "../models/AssetAcknowledgment-model.js"; 

export const createAssignedProduct = async (req, res) => {
  const { user: id, product: productId, workspacename, description } = req.body;

  if (!id) throw new CustomError.BadRequestError(ProductMessages.PROVIDE_ID);

  let verifyUser = await User.findById(id);
  let roleSource = "User";
  if (!verifyUser) {
    verifyUser = await Admin.findById(id);
    roleSource = "Admin";
  }
  if (!verifyUser) throw new CustomError.NotFoundError(`No user found with id ${id}`);
  if (verifyUser.status !== "active") {
    throw new CustomError.BadRequestError(ProductMessages.USER_NOT_ACTIVE);
  }

  const product = await Product.findById(productId);
  if (!product) throw new CustomError.NotFoundError(ProductMessages.NO_PRODUCT_EXISTS);
  if (product.tag !== "notassigned") {
    throw new CustomError.BadRequestError(ProductMessages.PRODUCT_ALREADY_IN_USE);
  }

  const assignedBy = req.user.id;
const assignedByModel = req.user.role === "superadmin" ? "Admin" : "User";

  // 1. Create asset acknowledgement only (do not assign yet)
  const acknowledgement = await AssetAcknowledgement.create({
    user: id,
    product: productId,
    status: "pending",
    requestDate: new Date(),
    workspacename,
    description,
    assignedBy,
    assignedByModel
  });

  // 2. Send acknowledgement email with Accept/Decline links
  const ackId = acknowledgement._id;
  await sendEmail({
    email: verifyUser.email,
    subject: "Asset Acknowledgement Request",
    html: `
    <!-- email body here with Accept/Decline links -->
      <table style="width: 100%; max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-family: Arial, sans-serif; overflow: hidden;">
          <tr style="background-color: #4CAF50; color: white;">
            <td style="padding: 20px; text-align: center;">
              <h2>Asset Acknowledgement Request</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 16px;">Hello <strong>${verifyUser.fname} ${verifyUser.lname}</strong>,</p>
              <p style="font-size: 15px; color: #555;">
                You have been assigned a new asset 
                <strong>${product.accessoriesName || "Asset"}</strong>.
                Please accept or decline the assignment by choosing an option below.
              </p>
    
              <div style="text-align: center; margin: 30px 0;"></div>
      <a href="${process.env.CLIENT_URL}/acknowledge/${ackId}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Acknowledge Asset</a>
      </div>
    
    <p style="font-size: 14px; color: #777;">
      If you did not expect this assignment, please decline it.
    </p>

    <p style="font-size: 14px; color: #777; margin-top: 40px;">
      Regards,<br/>
      IT Asset Management Team
    </p>
  </td>
</tr>
<tr style="background-color: #f0f0f0;">
  <td style="padding: 10px; text-align: center; font-size: 12px; color: #888;">
    © 2025 Your Company Name. All rights reserved.
  </td>
</tr>
</table>
`
  });

  res.status(StatusCodes.CREATED).json({ msg: "Acknowledgement request sent" });
};


export const getAllAssignedProductByWorkspacename = async (req, res) => {
  try {
    const { workspacename } = req.query; // Get workspace from request query

    let query = { status: "active" };

    if (workspacename) {
      query.workspacename = workspacename; // Filter by workspace name
    }

    const response = await AssignedProduct.find(query)
      .populate({ path: "user", select: "email fname lname userName branch teamTitle status" })
      .populate({
        path: "product",
        select:
          "productType productCategory warrantyPeriod systemModel systemBrand cpu ram storageType storageCapacity os macAddress productKey serialNumber accessoriesName networkDeviceName tag",
      })
      .populate({ path: "assignedBy", select: "email" });


    const finalResponse = response.map((item) => ({
      _id: item._id,
      firstName: item.user.fname,
      lastName: item.user.lname,
      email: item.user.email,
      username: item.user.userName,
      status: item.user.status,
      teamTitle: item.user.teamTitle,
      branch: item.user.branch,
      status: item.user.status,
      teamTitle: item.user.teamTitle,
      warrantyPeriod: item.product.warrantyPeriod,
      productCategory: item.product.productCategory,
      systemModel: item.product.systemModel,
      productType: item.product.productType,
      systemBrand: item.product.systemBrand,
      cpu: item.product.cpu,
      ram: item.product.ram,
      storageCapacity: item.product.storageCapacity,
      os: item.product.os,
      macAddress: item.product.macAddress,
      productKey: item.product.productKey,
      serialNumber: item.product.serialNumber,
      accessoriesName: item.product.accessoriesName || "--",
      networkDeviceName: item.product.networkDeviceName || "--",
      tag: item.product.tag,
      storageType: item.product.storageType,
      assignBy: item.assignedBy.email,
      assignDate: item.createdAt,
      description: item.description || "--", 
    }));
    res.status(StatusCodes.OK).json({ assignedDevices: finalResponse });
  } catch (error) {
    console.error(" Error fetching assigned products:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: ProductMessages.FETCHING_PRODUCTS_ERR });
  }
};


export const getSingleAssignedProduct = async (req, res) => {
  const { id: assignedDeviceId } = req.params;
  let query = { _id: assignedDeviceId };

  if (req.user.role === "admin") {
    query.branch = req.user.branch;
  }

  const singleAssignedDevice = await AssignedProduct.findOne(query)
    .populate({ path: "user", select: "email fname lname userName" })
    .populate({
      path: "product",
      select:
        "productType branch productCategory warrantyPeriod systemName systemModel systemBrand cpu ram storageType storageCapacity os macAddress productKey serialNumber accessoriesName networkDeviceName tag",
    })
    .populate({ path: "assignedBy", select: "email" });

  if (!singleAssignedDevice) {
    throw new CustomError.NotFoundError(`No document found with id ${assignedDeviceId}`);
  }

  res.status(StatusCodes.OK).json({ assignedDevice: singleAssignedDevice });
};

export const getCurrentUserAssignedProduct = async (req, res) => {
  const myList = await AssignedProduct.find({ user: req.user.id, status: "active" });

  if (!myList.length) {
    throw new CustomError.NotFoundError(ProductMessages.NO_DEVICES_ASSIGNED);
  }

  const [{ user: id }] = myList;
  checkPermission(req.user, id);
  
  res.status(StatusCodes.OK).json({ myList });
};

export const removeAssignedProduct = async (req, res) => {
  const { id: assignedDeviceId } = req.params;

  const assignedDevice = await AssignedProduct.findById(assignedDeviceId);
  if (!assignedDevice) {
    throw new CustomError.NotFoundError(`No document found with id ${assignedDeviceId}`);
  }

  try {
    const response = await AssignedProduct.findByIdAndUpdate(assignedDeviceId, { status: "inactive" });

    await Product.findByIdAndUpdate(response.product, { tag: "notassigned", assetStatus: "available" });

    res.status(StatusCodes.OK).json({ msg: ProductMessages.ASSIGNED_PRODUCT_UPDATED });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const deleteAllAssignedProduct = async (req, res) => {
  await AssignedProduct.deleteMany({});
  res.status(StatusCodes.OK).json({ message: ProductMessages.ALL_ASSIGNED_PRODUCTS_DELETED });
};
