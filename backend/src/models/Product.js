import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      index: true,
      maxlength: [120, 'Product name cannot exceed 120 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
      maxlength: [2000, 'Product description cannot exceed 2000 characters']
    },
    price: {
      type: String, // String or Number? Wait, price should be Number!
      type: Number,
      required: [true, 'Please provide a product price'],
      min: [0, 'Product price cannot be negative']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please specify a category'],
      index: true
    },
    stock: {
      type: Number,
      required: [true, 'Please specify product stock quantity'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0
    },
    images: {
      type: [String],
      required: [true, 'Please upload at least one image'],
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Product must have at least one image'
      }
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please assign a seller'],
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved' // Default to approved so users can see seeded listings instantly
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be less than 0'],
        max: [5, 'Rating cannot exceed 5']
      },
      count: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
