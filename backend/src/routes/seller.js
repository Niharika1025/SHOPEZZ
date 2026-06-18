import express from 'express';
import { getSellerStats } from '../controllers/sellerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('seller'));

router.get('/dashboard/stats', getSellerStats);

export default router;
