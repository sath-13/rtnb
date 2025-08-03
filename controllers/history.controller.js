import * as historyService from "../service/history.service.js";

export const getHistoryByActionId = async (req, res) => {
  try {
    const { actionId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const historyData = await historyService.getHistoryByActionIdService(actionId, page, limit);
    res.status(200).json(historyData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logHistory = async (req, res) => {
  try {
    const { actionId, modifiedBy, modifiedByName, changes, role } = req.body;

    const result = await historyService.logHistoryService(actionId, modifiedBy, modifiedByName, changes, role);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

