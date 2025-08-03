import express from "express";
import { acceptAcknowledgement,getAssetAcknowledgementById,getAllAssetAcknowledgements, declineAcknowledgement } from "../controllers/AssetAknowldgementController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Accept asset
router.patch("/accept/:id", authMiddleware, acceptAcknowledgement);

// Decline asset
router.patch("/decline/:id", declineAcknowledgement);

router.get("/request/:id", getAssetAcknowledgementById);

router.get("/all", getAllAssetAcknowledgements);

export default router;
