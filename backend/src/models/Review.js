import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars']
    },
    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
      maxlength: [500, 'Comment cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Prevent user from submitting more than one review per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to calculate average rating and count
reviewSchema.statics.calculateAverageRating = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        nRatings: { $sum: 1 }
      }
    }
  ]);

  try {
    if (stats.length > 0) {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        'ratings.average': Math.round(stats[0].averageRating * 10) / 10,
        'ratings.count': stats[0].nRatings
      });
    } else {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        'ratings.average': 0,
        'ratings.count': 0
      });
    }
  } catch (err) {
    console.error('Error calculating average rating:', err);
  }
};

// Call calculateAverageRating after save
reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.product);
});

// Call calculateAverageRating after deletion
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.product);
  }
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
