import AccessMatrixHistory from '../models/AccessMatrixHistory-model.js';

// Fetch access matrix history for a company
export const getAccessMatrixHistory = async (req, res) => {
  try {
    const { companyId } = req.params;
    const history = await AccessMatrixHistory.find({ companyId })
      .sort({ timestamp: -1 });
    // Format for frontend compatibility
    const formattedHistory = history.map(item => ({
      ...item.toObject(),
      modifiedBy: item.userInfo || {},
      createdAt: item.timestamp,
    }));
    res.json({ success: true, data: formattedHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching access matrix history', error });
  }
};

// Log a new access matrix change
export const logAccessMatrixChange = async (req, res) => {
  try {
    const { companyId, changedBy, userInfo, changes, previousMatrix, newMatrix } = req.body;
    // Debug log incoming data
    console.log('logAccessMatrixChange payload:', req.body);
    const entry = new AccessMatrixHistory({
      companyId,
      changedBy,
      userInfo, // Store user details
      changes,
      previousMatrix,
      newMatrix,
    });
    await entry.save();
    res.json({ success: true, entry });
  } catch (error) {
    console.error('Error in logAccessMatrixChange:', error);
    res.status(500).json({ success: false, message: 'Error logging access matrix change', error });
  }
};
