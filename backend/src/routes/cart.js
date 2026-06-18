import express from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart } from '../controllers/cartController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('buyer'));

router.route('/')
  .get(getCart);

router.route('/items')
  .post(addToCart);

router.route('/items/:productId')
  .put(updateCartItem)
  .delete(removeFromCart);

export default router;
