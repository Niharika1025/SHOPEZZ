import Product from '../models/Product.js';
import Review from '../models/Review.js';
import { logActivity } from '../utils/logger.js';

// @desc    Get all products (with search, filter, pagination, sorting)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const reqQuery = { ...req.query };

    // Fields to exclude from filtering (handled separately)
    const removeFields = ['search', 'category', 'minPrice', 'maxPrice', 'minRating', 'sort', 'page', 'limit'];
    removeFields.forEach((param) => delete reqQuery[param]);

    // Create query object
    let query = { ...reqQuery };

    // Default to showing only approved listings
    query.status = 'approved';

    // Search filter
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Price range filters
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) {
        query.price.$gte = Number(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        query.price.$lte = Number(req.query.maxPrice);
      }
    }

    // Rating filter
    if (req.query.minRating) {
      query['ratings.average'] = { $gte: Number(req.query.minRating) };
    }

    // Build Mongoose query
    let mongooseQuery = Product.find(query).populate('category', 'name slug');

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      mongooseQuery = mongooseQuery.sort(sortBy);
    } else {
      mongooseQuery = mongooseQuery.sort('-createdAt'); // Default: newest first
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    const total = await Product.countDocuments(query);

    mongooseQuery = mongooseQuery.skip(startIndex).limit(limit);

    // Execute query
    const products = await mongooseQuery;

    res.status(200).json({
      status: 'success',
      count: products.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      },
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('seller', 'name email avatar');

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Seller only)
export const createProduct = async (req, res, next) => {
  const { name, description, price, category, stock, images } = req.body;

  try {
    if (!name || !description || price === undefined || !category || stock === undefined || !images) {
      return res.status(400).json({ status: 'error', message: 'Please provide all required product details' });
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      stock: Number(stock),
      images: Array.isArray(images) ? images : [images],
      seller: req.user._id,
      status: 'approved' // Default to approved so it is instantly public in local dev
    });

    await logActivity(req.user._id, 'PRODUCT_CREATE', { productId: product._id, name: product.name }, req.ip);

    res.status(201).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Seller owner or Admin)
export const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    // Verify ownership or admin role
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to update this product listing'
      });
    }

    // Handle updates
    const allowedUpdates = ['name', 'description', 'price', 'category', 'stock', 'images'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'price' || field === 'stock') {
          product[field] = Number(req.body[field]);
        } else {
          product[field] = req.body[field];
        }
      }
    });

    const updatedProduct = await product.save();

    await logActivity(req.user._id, 'PRODUCT_UPDATE', { productId: product._id, name: product.name }, req.ip);

    res.status(200).json({
      status: 'success',
      data: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Seller owner or Admin)
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    // Verify ownership or admin role
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to delete this product listing'
      });
    }

    await Product.findByIdAndDelete(req.params.id);
    await Review.deleteMany({ product: req.params.id });

    await logActivity(req.user._id, 'PRODUCT_DELETE', { productId: product._id, name: product.name }, req.ip);

    res.status(200).json({
      status: 'success',
      message: 'Product listing successfully deleted'
    });
  } catch (error) {
    next(error);
  }
};
