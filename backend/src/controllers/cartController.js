import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Helper to populate cart details
const getPopulatedCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name price images stock seller'
  });
  
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    return cart;
  }

  // Self-heal cart by removing items whose products no longer exist
  const initialLength = cart.items.length;
  cart.items = cart.items.filter((item) => item.product !== null);

  if (cart.items.length < initialLength) {
    await cart.save();
  }

  return cart;
};

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private (Buyer only)
export const getCart = async (req, res, next) => {
  try {
    const cart = await getPopulatedCart(req.user._id);
    res.status(200).json({
      status: 'success',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private (Buyer only)
export const addToCart = async (req, res, next) => {
  const { productId, quantity } = req.body;
  const qty = parseInt(quantity, 10) || 1;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    if (product.stock === 0) {
      return res.status(400).json({ status: 'error', message: 'Product is out of stock' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

    if (itemIndex > -1) {
      // Item exists, increase quantity
      const newQty = cart.items[itemIndex].quantity + qty;
      if (newQty > product.stock) {
        return res.status(400).json({
          status: 'error',
          message: `Cannot add more items. Available stock: ${product.stock}, current in cart: ${cart.items[itemIndex].quantity}`
        });
      }
      cart.items[itemIndex].quantity = newQty;
    } else {
      // Add new item
      if (qty > product.stock) {
        return res.status(400).json({
          status: 'error',
          message: `Requested quantity exceeds available stock (${product.stock})`
        });
      }
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();
    
    // Retrieve fully populated cart to return
    const populatedCart = await getPopulatedCart(req.user._id);

    res.status(200).json({
      status: 'success',
      data: populatedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quantity of item in cart
// @route   PUT /api/cart/items/:productId
// @access  Private (Buyer only)
export const updateCartItem = async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const qty = parseInt(quantity, 10);

  try {
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid quantity' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    if (qty > product.stock) {
      return res.status(400).json({
        status: 'error',
        message: `Requested quantity exceeds available stock (${product.stock})`
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ status: 'error', message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = qty;
    await cart.save();

    const populatedCart = await getPopulatedCart(req.user._id);

    res.status(200).json({
      status: 'success',
      data: populatedCart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:productId
// @access  Private (Buyer only)
export const removeFromCart = async (req, res, next) => {
  const { productId } = req.params;

  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ status: 'error', message: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();

    const populatedCart = await getPopulatedCart(req.user._id);

    res.status(200).json({
      status: 'success',
      data: populatedCart
    });
  } catch (error) {
    next(error);
  }
};
