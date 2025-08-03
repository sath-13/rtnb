import express from "express";
import {
  createAssignedProduct,
  getSingleAssignedProduct,
  getCurrentUserAssignedProduct,
  removeAssignedProduct,
  deleteAllAssignedProduct,
  getAllAssignedProductByWorkspacename,
} from "../controllers/assignedProductController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create an assigned product (any authenticated user can assign a product)
router.post("/", authMiddleware, createAssignedProduct);

// Get all assigned products (only admins and superadmins can view all)
router.get("/", authMiddleware, getAllAssignedProductByWorkspacename);

// Get all products assigned to the current user
router.get("/allMyProducts", authMiddleware, getCurrentUserAssignedProduct);

// Delete all assigned products (restricted to superadmins/admins)
router.delete("/deleteAllAssignedProduct", authMiddleware, deleteAllAssignedProduct);

// Get, update, or delete a single assigned product by ID (restricted to admin/superadmin)
router.get("/:id", authMiddleware, getSingleAssignedProduct);
router.patch("/:id", authMiddleware, removeAssignedProduct);

export default router;
