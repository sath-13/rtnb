import History from "../models/history-model.js";
import Admin from "../models/SuperAdmin-model.js";
import { HistoryMessages } from "../constants/enums.js";

/**
 * Fetch history records by actionId with pagination.
 */
export const getHistoryByActionIdService = async (actionId, page = 1, limit = 5) => {
  try {
    const skip = (page - 1) * limit;
    const history = await History.find({ actionId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await History.countDocuments({ actionId });

    return { data: history, total };
  } catch (error) {
    console.error(HistoryMessages.ERROR_FETCHING_HISTORY, error);
    throw new Error(HistoryMessages.FAILED_TO_FETCH);
  }
};

/**
 * Log history of an action.
 */
export const logHistoryService = async (actionId, modifiedBy, modifiedByName, changes, role) => {
  try {
    if (!actionId || !modifiedBy || !modifiedByName || !changes.length || !role) {
      throw new Error(HistoryMessages.INVALID_HISTORY_DATA);
    }

    let modifiedByModel;
    if (role === "superadmin") {
      const isAdmin = await Admin.findById(modifiedBy);
      modifiedByModel = isAdmin ? "Admin" : "User";
    } else {
      modifiedByModel = "User"; // Default for other roles
    }

    const newHistory = new History({
      actionId,
      modifiedBy,
      modifiedByName,
      modifiedByModel,
      changes,
    });

    await newHistory.save();
    return { message: HistoryMessages.HISTORY_LOGGED_SUCCESSFULLY };
  } catch (error) {
    console.error(HistoryMessages.ERROR_LOGGING_HISTORY, error);
    throw new Error(HistoryMessages.FAILED_TO_LOG_HISTORY);
  }
};
