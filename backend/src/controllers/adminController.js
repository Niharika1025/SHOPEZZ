import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import AuditLog from '../models/AuditLog.js';
import { logActivity } from '../utils/logger.js';
import { createNotification } from '../utils/notifier.js';

// @desc    Get global stats for admin dashboard
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin only)
export const getAdminStats = async (req, res, next) => {
  try {
    // 1. Total System Revenue
    const revenueData = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);
    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // 2. User counts grouped by role
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    const userCounts = { buyer: 0, seller: 0, admin: 0 };
    userStats.forEach((stat) => {
      if (userCounts[stat._id] !== undefined) {
        userCounts[stat._id] = stat.count;
      }
    });

    // 3. Product counts grouped by status
    const productStats = await Product.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    const productCounts = { pending: 0, approved: 0, rejected: 0 };
    productStats.forEach((stat) => {
      if (productCounts[stat._id] !== undefined) {
        productCounts[stat._id] = stat.count;
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        userCounts,
        productCounts,
        totalOrders: await Order.countDocuments({ paymentStatus: 'paid' })
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort('-createdAt');
    res.status(200).json({
      status: 'success',
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user status (suspend/activate)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
export const toggleUserStatus = async (req, res, next) => {
  const { status } = req.body;

  try {
    if (!status || !['active', 'suspended'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid status (active or suspended)' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ status: 'error', message: 'Admin accounts cannot be suspended' });
    }

    user.status = status;
    await user.save();

    // Trigger Notification & Logger
    const action = status === 'suspended' ? 'USER_SUSPEND' : 'USER_ACTIVATE';
    await logActivity(req.user._id, action, { targetUserId: user._id, email: user.email }, req.ip);
    
    await createNotification(
      user._id,
      `Account Status Changed`,
      `Your account has been set to: ${status}.`,
      'account_update'
    );

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle product listing approval status
// @route   PUT /api/admin/products/:id/status
// @access  Private (Admin only)
export const toggleProductStatus = async (req, res, next) => {
  const { status } = req.body;

  try {
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid status (pending, approved, or rejected)' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product listing not found' });
    }

    product.status = status;
    await product.save();

    const action = status === 'approved' ? 'PRODUCT_APPROVED' : 'PRODUCT_REJECTED';
    await logActivity(req.user._id, action, { productId: product._id, name: product.name }, req.ip);

    // Notify seller
    await createNotification(
      product.seller,
      `Listing Moderation Update`,
      `Your product listing '${product.name}' was ${status} by admin moderators.`,
      'product_approval'
    );

    res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders list
// @route   GET /api/admin/orders
// @access  Private (Admin only)
export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({}).populate('buyer', 'name email').sort('-createdAt');
    res.status(200).json({
      status: 'success',
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all system audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin only)
export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({})
      .populate('user', 'name email role')
      .sort('-createdAt')
      .limit(100); // Limit to last 100 entries for display

    res.status(200).json({
      status: 'success',
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};
