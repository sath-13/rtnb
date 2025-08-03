import express from 'express';
import { importWFHRecords, getWFHRecords } from '../controllers/wfhController.js';
import WFHDayRecord from '../models/WFHDayRecord.js';

const router = express.Router();

// GET /api/wfh/all?month=YYYY-MM - Fetch all WFH records for a month
router.get('/all', async (req, res) => {
    try {
      const { month } = req.query; // format: YYYY-MM
      if (!month) {
        return res.status(400).json({ message: 'month is required.' });
      }
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const records = await WFHDayRecord.find({
        date: { $gte: start, $lt: end },
      }).sort({ employeeId: 1, date: 1 });
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

// Debug endpoint: GET /api/wfh/debug-all - Fetch all WFH records (for troubleshooting only)
router.get('/debug-all', async (req, res) => {
  try {
    const records = await WFHDayRecord.find({}).sort({ date: 1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/wfh/list - Fetch WFH records with optional filters (month, range, employeeId)
router.get('/list', async (req, res) => {
  try {
    const { month, start, end, employeeId } = req.query;
    const query = {};
    if (employeeId) query.employeeId = employeeId;
    if (month) {
      const startDate = new Date(`${month}-01T00:00:00.000Z`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    } else if (start && end) {
      const startDate = new Date(`${start}-01T00:00:00.000Z`);
      const endDate = new Date(`${end}-01T00:00:00.000Z`);
      endDate.setMonth(endDate.getMonth() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }
    const records = await WFHDayRecord.find(query).sort({ employeeId: 1, date: 1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/import', importWFHRecords);
router.get('/:employeeId', getWFHRecords);


export default router; 