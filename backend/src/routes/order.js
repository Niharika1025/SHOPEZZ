import express from 'express';
import {
  createMockOrder,
  getMyOrders,
  getSellerOrders,
  getOrderById,
  updateOrderStatus,
  createCheckoutSession,
  handleStripeWebhook
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public webhook route (Stripe signs the payload)
router.post('/webhook', handleStripeWebhook);

router.use(protect);

router.post('/', authorize('buyer'), createMockOrder);
router.post('/checkout-session', authorize('buyer'), createCheckoutSession);
router.get('/my-orders', authorize('buyer'), getMyOrders);
router.get('/seller-orders', authorize('seller'), getSellerOrders);

router.route('/:id')
  .get(getOrderById);

router.put('/:id/status', authorize('seller', 'admin'), updateOrderStatus);

export default router;
