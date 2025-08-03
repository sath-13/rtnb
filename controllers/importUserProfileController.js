import StatusCodes from 'http-status-codes';
import ImportedUserProfile from '../models/ImportedUserProfile.js';

export const importUserProfiles = async (req, res, next) => {
  try {

    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'No user profile data provided.' });
    }

    // Insert all user profiles (with dynamic fields)
    const results = await ImportedUserProfile.insertMany(data);
    res.status(StatusCodes.OK).json({ message: 'User profiles imported successfully.', results });
  } catch (error) {
    next(error);
  }
};
