import Category from '../models/Category.js';
import { logActivity } from '../utils/logger.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({});
    res.status(200).json({
      status: 'success',
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res, next) => {
  const { name, description } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Category name is required' });
    }

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ status: 'error', message: 'Category already exists' });
    }

    const category = await Category.create({ name, description });

    await logActivity(req.user._id, 'CATEGORY_CREATE', { categoryId: category._id, name: category.name }, req.ip);

    res.status(201).json({
      status: 'success',
      data: category
    });
  } catch (error) {
    next(error);
  }
};
