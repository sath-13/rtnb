// controllers/reminderController.js
import Reminder from "../models/ReminderModel.js";

export const createReminder = async (req, res) => {
  try {
    const { title, description, remindAt, companyId, userId, icon, workspaceName } = req.body;

    if (!title || !remindAt || !companyId || !userId || !workspaceName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const reminder = new Reminder({
      title,
      description,
      remindAt,
      companyId,
      userId,
      icon: icon || "FaRegBell",
      workspaceName,
    });

    await reminder.save();
    res.status(201).json({ message: "Reminder created successfully", reminder });
  } catch (error) {
    console.error("Error creating reminder:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// controllers/reminderController.js
export const getRemindersByWorkspace = async (req, res) => {
  try {
    const { workspaceName } = req.params;

    const reminders = await Reminder.find({ workspaceName }).sort({ createdAt: -1 });

    res.status(200).json(reminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    res.status(500).json({ message: "Server error" });
  }
};
