import express from 'express';
import { getProductReviews, createReview, deleteReview } from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/product/:productId', getProductReviews);

router.post('/', protect, authorize('buyer'), createReview);
router.delete('/:id', protect, deleteReview);

export default router;
