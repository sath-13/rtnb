import express from 'express';
import {
  getCategories,
  addCategory,
  getTypesByCategory,
  addType,
  updateType,
  deleteType,
  updateCategory,
  deleteCategory
} from '../controllers/assetController.js';

const router = express.Router();

// Category Routes
router.get('/categories', getCategories);
router.post('/categories', addCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Asset Type Routes
router.get('/types/:categoryId', getTypesByCategory);
router.post('/types', addType);
router.put('/types/:id', updateType);
router.delete('/types/:id', deleteType);

export default router;
