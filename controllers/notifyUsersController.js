import * as notificationService from "../service/notification.service.js";

export const notifyUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await notificationService.notifyUsersService(id);
    res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

