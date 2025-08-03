import express from "express";
import {
  createProduct,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  deleteAllProduct,
  getAllProductByWorkspacename,
  getAllProductByUser,
  importProductData,
  upload
} from "../controllers/productcontroller.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.post('/import', upload.single('file'),authMiddleware, importProductData);

router.get("/",authMiddleware, getAllProductByWorkspacename);
router.get("/user-product",authMiddleware, getAllProductByUser);
// router.post("/", authMiddleware, createProduct);
router.post("/create", upload.fields([
  { name: "assetImage", maxCount: 1 },  // Limit to 1 file for assetImage
  { name: "assetDocument", maxCount: 1 } // Limit to 1 file for assetDocument
]), authMiddleware,createProduct);
router.delete("/deleteAllProduct", authMiddleware, deleteAllProduct);

router.get("/:id", authMiddleware, getSingleProduct);
router.patch("/:id", upload.fields([
  { name: "assetImage", maxCount: 1 },  // Limit to 1 file for assetImage
  { name: "assetDocument", maxCount: 1 } // Limit to 1 file for assetDocument
]), authMiddleware, updateProduct);
router.delete("/:id", authMiddleware, deleteProduct);

export default router;
