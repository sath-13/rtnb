import Product from "../models/product-model.js";
import { StatusCodes } from "http-status-codes";
import CustomError from "../errors/index.js";
import { ProductMessages } from "../constants/enums.js";
import { BadRequest, InternalServer } from '../middlewares/customError.js';
import multer from "multer";
import xlsx from "xlsx";
import AssetTypeModel from "../models/AssetTypeModel.js";
import AssetCategoryModel from "../models/AssetCategoryModel.js";
import { excelDateToJSDate } from "../utils/dataUtils.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Ensure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});


export const importProductData = async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) return next(BadRequest("No file uploaded"));

    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const workspacename = req.body.workspacename;

    for (const row of data) {
      const productCategoryName = row.productCategoryName?.trim();
      const productTypeName = row.productTypeName?.trim();

      // 1. Check or Create Category
      let category = await AssetCategoryModel.findOne({
        name: new RegExp(`^${productCategoryName}$`, "i"),
      });

      if (!category) {
        category = new AssetCategoryModel({
          name: productCategoryName,
          description: `Auto-created during product import`,
        });
        await category.save();
      }

      // 2. Check or Create Type
      let type = await AssetTypeModel.findOne({
        name: new RegExp(`^${productTypeName}$`, "i"),
        categoryId: category._id,
      });

      if (!type) {
        type = new AssetTypeModel({
          name: productTypeName,
          description: `Auto-created during product import`,
          categoryId: category._id,
        });
        await type.save();
      }

      // 3. Create Product
      const newProduct = new Product({
        branch: row.branch,
        dateOfPurchase: excelDateToJSDate(row.dateOfPurchase),
        productCategory: category._id,
        productType: type._id,
        productCategoryName: productCategoryName,
        productTypeName: productTypeName,
        warrantyPeriod: row.warrantyPeriod,
        systemModel: row.systemModel,
        systemBrand: row.systemBrand,
        cpu: row.cpu,
        ram: row.ram,
        storageType: row.storageType,
        storageCapacity: row.storageCapacity,
        os: row.os,
        macAddress: row.macAddress,
        productKey: row.productKey,
        serialNumber: row.serialNumber,
        accessoriesName: row.accessoriesName,
        assetCondition: row.assetCondition,
        assetStatus: row.assetStatus,
        assetDescription: row.assetDescription,
        tag: row.tag || "notassigned",
        workspacename,
        createdBy: req.user.id || req.user._id,
      });

      await newProduct.save();

      // 4. Increment assetCount of this type
      await AssetTypeModel.findByIdAndUpdate(type._id, {
        $inc: { assetCount: 1 },
      });

    }

    res.status(200).json({ message: "Product import completed successfully" });
  } catch (error) {
    console.error(" Error while importing products:", error);
    next(InternalServer("Internal server error"));
  }
};

export const createProduct = async (req, res) => {

  if (req.fileValidationError) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "File size exceeds the 10MB limit" });
  }


  // Assign the current user ID to the product
  req.body.createdBy = req.user.id;

  // If the user is an admin, assign the branch from the user info
  if (req.user.role === "admin") {
    req.body.branch = req.user.branch;
  }

  // Ensure the product category exists in the AssetCategory collection
  if (req.body.productCategory) {
    const category = await AssetCategoryModel.findById(req.body.productCategory);
    if (!category) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Invalid product category" });
    }
  }

  // Check if files were uploaded
  if (req.files) {
    if (req.files.assetImage) {
      // Save the relative file path to the database (without the server path)
      req.body.assetImage = `upload/${req.files.assetImage[0].filename}`;
    }
    if (req.files.assetDocument) {
      req.body.assetDocument = `upload/${req.files.assetDocument[0].filename}`;
    }
  }

  try {
    // Create the product in the database
    const product = await Product.create(req.body);

    // Update assetCount 
    if (product.productType) {
      await AssetTypeModel.findByIdAndUpdate(product.productType, {
        $inc: { assetCount: 1 }, // Increment asset count by 1
      });
    }

    res.status(StatusCodes.CREATED).json({ product });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error creating product", error });
  }
};

export const getAllProductByWorkspacename = async (req, res) => {
  try {
    let { workspacename } = req.query; // Get workspace name from query params
    let products;

    if (req.user.role === "superadmin") {
      products = await Product.find(workspacename ? { workspacename: workspacename } : {});
    }

    if (req.user.role === "admin") {
      let { branch } = req.user;
      let query = { branch };
      if (workspacename) {
        query.workspacename = workspacename;
      }
      products = await Product.find(query);
    }

    res.status(StatusCodes.OK).json({ products, count: products.length });
  } catch (error) {
    console.error(" Error fetching products:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: ProductMessages.SERVER_ERR});
  }
};

export const getAllProductByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    let products;

    // Check the user's role and filter accordingly
    if (req.user.role === "superadmin") {
      // Superadmins can view products created by any user
      products = await Product.find({ createdBy: userId });
    } else if (req.user.role === "admin") {
      // Admins can only view products created by them, filtered by createdBy
      products = await Product.find({ createdBy: userId });
    } else {
      return res.status(StatusCodes.FORBIDDEN).json({ message: "You do not have permission to view these products." });
    }
    res.status(StatusCodes.OK).json({ products, count: products.length });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: ProductMessages.SERVER_ERR });
  }
};

export const getSingleProduct = async (req, res) => {
  const { id: productId } = req.params;
  const product = await Product.findOne({ _id: productId });

  if (!product) {
    throw new CustomError.NotFoundError(`No product found with ${productId}`);
  }

  res.status(StatusCodes.OK).json({ product });
};

export const updateProduct = async (req, res) => {
  const { id: productId } = req.params;
   // Check file size error
   if (req.fileValidationError) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "File size exceeds the 10MB limit" });
  }

  // Handle uploaded files (same as create)
  if (req.files) {
    if (req.files.assetImage) {
      req.body.assetImage = `upload/${req.files.assetImage[0].filename}`
    }
    if (req.files.assetDocument) {
      req.body.assetDocument = `upload/${req.files.assetDocument[0].filename}`;
    }
  }
  try {
    const product = await Product.findOneAndUpdate({ _id: productId }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      throw new CustomError.NotFoundError(`No product found with ${productId}`);
    }

    res.status(StatusCodes.OK).json({ product });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error updating product", error });
  }
};

export const deleteProduct = async (req, res) => {
  const { id: productId } = req.params;
  
  // Find product by id
  const product = await Product.findById(productId);

  if (!product) {
    throw new CustomError.NotFoundError(`No product found with id ${productId}`);
  }

  // Decrement assetCount
  if (product.productType) {
    await AssetTypeModel.findByIdAndUpdate(product.productType, {
      $inc: { assetCount: -1 }, // Decrement asset count by 1
    });
  }

  // Delete product using findByIdAndDelete
  await Product.findByIdAndDelete(productId);

  res.status(StatusCodes.OK).json({ msg: ProductMessages.PRODUCT_DELETED_SUCC });
};

export const deleteAllProduct = async (req, res) => {
  await Product.deleteMany({});
  res.status(StatusCodes.OK).json({ msg: ProductMessages.ALL_PRODUCTS_DELETED });
};
