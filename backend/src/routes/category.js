import express from 'express';
import { getCategories, createCategory } from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(getCategories)
  .post(protect, authorize('admin'), createCategory);

export default router;
