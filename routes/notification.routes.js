import express from "express";
import { deleteNotification, getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", getNotifications);

router.patch("/:id/read", markNotificationAsRead);

router.delete("/:id", deleteNotification);

router.patch("/mark-all", markAllNotificationsAsRead);


export default router;
