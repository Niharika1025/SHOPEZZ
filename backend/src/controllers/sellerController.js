import Order from '../models/Order.js';
import Product from '../models/Product.js';

// @desc    Get dashboard metrics & analytics for a seller
// @route   GET /api/seller/dashboard/stats
// @access  Private (Seller only)
export const getSellerStats = async (req, res, next) => {
  try {
    const sellerId = req.user._id;

    // 1. Calculate Total Revenue & Total Orders
    const salesData = await Order.aggregate([
      { $match: { 'items.seller': sellerId, paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          totalItemsSold: { $sum: '$items.quantity' }
        }
      }
    ]);

    const totalRevenue = salesData[0]?.totalRevenue || 0;
    const totalItemsSold = salesData[0]?.totalItemsSold || 0;

    // Count distinct orders containing this seller's products
    const totalOrders = await Order.countDocuments({
      'items.seller': sellerId,
      paymentStatus: 'paid'
    });

    // 2. Product stats
    const totalProducts = await Product.countDocuments({ seller: sellerId });
    const outOfStock = await Product.countDocuments({ seller: sellerId, stock: 0 });

    // 3. Date-grouped sales chart data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const chartData = await Order.aggregate([
      {
        $match: {
          'items.seller': sellerId,
          paymentStatus: 'paid',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          units: { $sum: '$items.quantity' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format chart data for frontend chart usage
    const formattedChartData = chartData.map((day) => ({
      date: day._id,
      sales: Math.round(day.sales * 100) / 100,
      units: day.units
    }));

    // 4. Retrieve seller's products list
    const products = await Product.find({ seller: sellerId }).populate('category', 'name');

    res.status(200).json({
      status: 'success',
      data: {
        metrics: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalItemsSold,
          totalOrders,
          totalProducts,
          outOfStock
        },
        chartData: formattedChartData,
        products
      }
    });
  } catch (error) {
    next(error);
  }
};
