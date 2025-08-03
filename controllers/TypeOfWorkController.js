import TypeOfWork from '../models/TypeOfWorkModel.js';

export const getAllTypeOfWork = async (req, res) => {
  try {
    const types = await TypeOfWork.find().sort({ name: 1 }); // Sorted alphabetically
    res.status(200).json(types);
  } catch (error) {
    console.error('Error fetching typeOfWork:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
