import * as notificationService from "../service/notification.service.js";
import { NotificationMessages } from "../constants/enums.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.getNotificationsService(req.query.userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const updatedNotification = await notificationService.markNotificationAsReadService(req.params.id);
    res.json({ success: true, message: NotificationMessages.NOTIFICATION_MARK_READ, notification: updatedNotification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    await notificationService.deleteNotificationService(req.params.id);
    res.json({ success: true, message: NotificationMessages.NOTIFICATION_DELETED });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllNotificationsAsReadService(req.query.userId);
    res.json({ success: true, message: NotificationMessages.MARK_ALL_NOTIFICATION_READ, result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
