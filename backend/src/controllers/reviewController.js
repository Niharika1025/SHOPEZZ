import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { logActivity } from '../utils/logger.js';

// @desc    Get all reviews for a specific product
// @route   GET /api/reviews/product/:productId
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name avatar')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add review for a product
// @route   POST /api/reviews
// @access  Private (Buyer only)
export const createReview = async (req, res, next) => {
  const { productId, rating, comment } = req.body;

  try {
    if (!productId || rating === undefined || !comment) {
      return res.status(400).json({ status: 'error', message: 'Please provide product, rating, and comment' });
    }

    // Verify rating limits
    const score = parseInt(rating, 10);
    if (isNaN(score) || score < 1 || score > 5) {
      return res.status(400).json({ status: 'error', message: 'Rating must be between 1 and 5' });
    }

    // 1. Guard check: Must be a verified buyer who completed a payment for this product
    const hasPurchased = await Order.findOne({
      buyer: req.user._id,
      paymentStatus: 'paid',
      'items.product': productId
    });

    if (!hasPurchased) {
      return res.status(403).json({
        status: 'error',
        message: 'Only verified buyers who purchased this product can leave a review.'
      });
    }

    // 2. Check if already reviewed (handled by DB index, but check proactively to give clean message)
    const alreadyReviewed = await Review.findOne({ product: productId, user: req.user._id });
    if (alreadyReviewed) {
      return res.status(400).json({ status: 'error', message: 'You have already reviewed this product' });
    }

    // 3. Create review
    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating: score,
      comment
    });

    // Populate user info for returning payload
    const populatedReview = await Review.findById(review._id).populate('user', 'name avatar');

    await logActivity(req.user._id, 'REVIEW_CREATE', { productId, reviewId: review._id, rating: score }, req.ip);

    res.status(201).json({
      status: 'success',
      data: populatedReview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Owner or Admin)
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ status: 'error', message: 'Review not found' });
    }

    // Check ownership or admin role
    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to delete this review'
      });
    }

    await Review.findByIdAndDelete(req.params.id);

    await logActivity(req.user._id, 'REVIEW_DELETE', { productId: review.product, reviewId: review._id }, req.ip);

    res.status(200).json({
      status: 'success',
      message: 'Review successfully deleted'
    });
  } catch (error) {
    next(error);
  }
};
