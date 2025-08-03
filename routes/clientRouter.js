import express from "express";
import multer from "multer";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  uploadClientImage,
  deleteClientImage,
} from "../controllers/clientController.js";

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.get("/", authMiddleware, getAllClients);
router.get("/:id", authMiddleware, getClientById);
router.post("/", authMiddleware, createClient);
router.put("/:id", authMiddleware, updateClient);
router.delete("/:id", authMiddleware, deleteClient);
router.post("/upload-image/:id", upload.single("image"), uploadClientImage);
router.delete("/delete-image/:id", authMiddleware, deleteClientImage);

export default router;
