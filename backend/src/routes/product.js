import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, authorize('seller'), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, authorize('seller', 'admin'), updateProduct)
  .delete(protect, authorize('seller', 'admin'), deleteProduct);

export default router;
