import { ActionMessages, CommonMessages } from "../constants/enums.js";
import { addUserToActionService,
   createActionService, 
  fetchActionById, 
  getActionByIdService, 
  getActionsService, 
  getFilesForActionService, 
  removeUserFromActionService, 
  updateActionStatusService, 
  updateActionTextService,
  updateAssignedUserService,
  uploadFilesService
 } from "../service/action.service.js";

export const createAction = async (req, res) => {
  try {
    const response = await createActionService(req.body, req.files);
    
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeUserFromAction = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const response = await removeUserFromActionService(id, userId);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateActionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const response = await updateActionStatusService(id, status);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateActionText = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const response = await updateActionTextService(id, description);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActions = async (req, res) => {
  try {
    const { userAssigned } = req.params;
    const actions = await getActionsService(userAssigned);
    res.status(200).json(actions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActionById = async (req, res) => {
  try {
    const action = await getActionByIdService(req.params.id);
    res.status(200).json(action);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addUserToAction = async (req, res) => {
  try {
    const { actionId } = req.params;
    const { userId } = req.body;
    const action = await addUserToActionService(actionId, userId);
    res.status(200).json(action);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActionDetails = async (req, res) => {
  try {
    const action = await fetchActionById(req.params.id);
    if (!action) {
      return res.status(404).json({ message: ActionMessages.ACTION_NOT_FOUND });
    }
    res.json(action);
  } catch (error) {
    console.error(ActionMessages.ERROR_FETCHING_DETAILS, error);
    res.status(500).json({ message: CommonMessages.SERVER_ERROR });
  }
};

export const getFilesForAction = async (req, res) => {
  try {
    const files = await getFilesForActionService(req.params.actionId, req);
    
    if (!files) {
      return res.status(404).json({ message: ActionMessages.ACTION_NOT_FOUND });
    }
    if (files.length === 0) {
      return res.status(404).json({ message: ActionMessages.NO_FILES_FOUND });
    }

    res.status(200).json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ message: CommonMessages.INTERNAL_SERVER_ERROR });
  }
};

export const updateAssignedUser = async (req, res) => {
  try {
      const { actionId } = req.params;
      const { newUserId } = req.body;

      const result = await updateAssignedUserService(actionId, newUserId);

      if (result.error) {
          return res.status(404).json({ message: result.error });
      }

      res.status(200).json({ message: result.message });

  } catch (error) {
      console.error(ActionMessages.UPDATE_ERR, error);
      res.status(500).json({ message: ActionMessages.SERVER_ERR});
  }
};

export const uploadFiles = async (req, res) => {
  try {
      const { actionId } = req.params;
      const result = await uploadFilesService(actionId, req.files);

      if (result.error) {
          return res.status(404).json({ message: result.error });
      }

      res.json({ message: result.message, files: result.files });

  } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: ActionMessages.SERVER_ERR });
  }
};
