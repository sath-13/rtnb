import ImportedUserProfile from '../models/ImportedUserProfile.js';
import StatusCodes from 'http-status-codes';

export const getImportedUserProfiles = async (req, res, next) => {
  try {
    const users = await ImportedUserProfile.find({});
    res.status(StatusCodes.OK).json(users);
  } catch (error) {
    next(error);
  }
};
