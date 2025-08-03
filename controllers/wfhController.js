import WFHDayRecord from '../models/WFHDayRecord.js';

// Import daily WFH records
export const importWFHRecords = async (req, res) => {
  try {
    const records = req.body.records;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'No records provided.' });
    }
    await WFHDayRecord.insertMany(records);
    res.status(201).json({ message: 'WFH records imported successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch daily WFH records for a user and month
export const getWFHRecords = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month } = req.query; // format: YYYY-MM
    if (!employeeId || !month) {
      return res.status(400).json({ message: 'employeeId and month are required.' });
    }
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const records = await WFHDayRecord.find({
      employeeId,
      date: { $gte: start, $lt: end },
    }).sort({ date: 1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
