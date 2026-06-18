import express from 'express';
import {
  getAdminStats,
  getUsers,
  toggleUserStatus,
  toggleProductStatus,
  getOrders,
  getAuditLogs
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard/stats', getAdminStats);
router.get('/users', getUsers);
router.put('/users/:id/status', toggleUserStatus);
router.put('/products/:id/status', toggleProductStatus);
router.get('/orders', getOrders);
router.get('/audit-logs', getAuditLogs);

export default router;
