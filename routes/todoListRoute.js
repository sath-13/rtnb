import express from 'express';
import { saveTasks, getAllTaskByUser, deleteTaskByUser } from '../controllers/todoListController.js';


const router = express.Router();

router.post('/save', saveTasks);
router.get('/', getAllTaskByUser);
router.delete('/:taskId', deleteTaskByUser);


export default router;