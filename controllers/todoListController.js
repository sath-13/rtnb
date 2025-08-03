import { todoMessages } from "../constants/enums.js";
import TodoList from "../models/TodoList.js";
import jwt from "jsonwebtoken"; 


// POST /api/task/save
export const saveTasks = async (req, res) => {
  const { userId, tasks, date } = req.body;

  if (!userId || !Array.isArray(tasks) || !date) {
    return res.status(400).json({ error: todoMessages.MISSING_DATA });
  }

  try {
    const insertData = tasks.map((task) => ({
      userId,
      text: task.text,
      completed: task.completed,
      recurring: task.recurring || false,
      date,
    }));

    await TodoList.insertMany(insertData);
    res.status(200).json({ message: todoMessages.TASK_SAVED });
  } catch (error) {
    console.error(todoMessages.FAILED_TO_SAVE_TASK, error);
    res.status(500).json({ error: todoMessages.INTERNAL_SERVER_ERRORS });
  }
};

export const deleteTaskByUser = async (req, res) => {
  try {
    const { taskId } = req.params;
    await TodoList.findByIdAndDelete(taskId);
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
};

export const getAllTaskByUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    
    const userId = decoded.id || decoded.userId;

    const today = new Date().toISOString().split("T")[0];
    const tasks = await TodoList.find({ userId, date: today });
    
    res.json({ tasks });
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};
