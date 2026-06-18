import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { createNotification } from '../utils/notifier.js';
import { logActivity } from '../utils/logger.js';
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from '../utils/email.js';
import stripe from '../config/stripe.js';

// @desc    Create a mock order (checkout)
// @route   POST /api/orders
// @access  Private (Buyer only)
export const createMockOrder = async (req, res, next) => {
  const { shippingAddress } = req.body;

  try {
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country) {
      return res.status(400).json({ status: 'error', message: 'Please provide complete shipping address details' });
    }

    // Retrieve buyer's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Your shopping cart is empty' });
    }

    const orderItems = [];
    let subtotal = 0;

    // Verify stock and construct order items copy
    for (let item of cart.items) {
      const prod = item.product;
      if (!prod) {
        return res.status(404).json({ status: 'error', message: 'One or more products in your cart no longer exist' });
      }

      if (prod.stock < item.quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Insufficient stock for product '${prod.name}'. Available: ${prod.stock}, Requested: ${item.quantity}`
        });
      }

      // Decrement stock
      prod.stock -= item.quantity;
      await prod.save();

      orderItems.push({
        product: prod._id,
        name: prod.name,
        price: prod.price,
        quantity: item.quantity,
        seller: prod.seller
      });

      subtotal += prod.price * item.quantity;
    }

    // Calculate shipping (free over $100, else $10)
    const shipping = subtotal > 100 ? 0 : 10.0;
    const totalAmount = subtotal + shipping;

    // Create Order
    const order = await Order.create({
      buyer: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentIntentId: `mock_pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentStatus: 'paid', // Mock successful payment directly
      orderStatus: 'pending'
    });

    // Clear cart items
    cart.items = [];
    await cart.save();

    // Trigger Notifications
    // 1. Notify Buyer
    await createNotification(
      req.user._id,
      'Order Placed Successfully',
      `Your order #${order._id} for $${totalAmount.toFixed(2)} was received. Payment status: Mock Paid.`,
      'order_status'
    );

    // Send email confirmation
    sendOrderConfirmationEmail(req.user.email, req.user.name, order);

    // 2. Notify Sellers
    const uniqueSellers = [...new Set(orderItems.map((item) => item.seller.toString()))];
    for (let sellerId of uniqueSellers) {
      await createNotification(
        sellerId,
        'New Order Received',
        `A buyer purchased one or more of your listings in order #${order._id}.`,
        'order_status'
      );
    }

    // Log administrative action
    await logActivity(req.user._id, 'ORDER_CREATE', { orderId: order._id, total: totalAmount }, req.ip);

    res.status(201).json({
      status: 'success',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get buyer's orders
// @route   GET /api/orders/my-orders
// @access  Private (Buyer only)
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyer: req.user._id }).sort('-createdAt');
    res.status(200).json({
      status: 'success',
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seller's orders
// @route   GET /api/orders/seller-orders
// @access  Private (Seller only)
export const getSellerOrders = async (req, res, next) => {
  try {
    // Find orders where at least one item belongs to this seller
    const orders = await Order.find({ 'items.seller': req.user._id }).sort('-createdAt');
    res.status(200).json({
      status: 'success',
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private (Buyer, Seller owner, Admin)
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email avatar');

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    // Check authorization: must be the buyer, a seller of an item in the order, or an admin
    const isBuyer = order.buyer._id.toString() === req.user._id.toString();
    const isSeller = order.items.some((item) => item.seller.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view this order details'
      });
    }

    res.status(200).json({
      status: 'success',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Seller or Admin)
export const updateOrderStatus = async (req, res, next) => {
  const { orderStatus } = req.body;

  try {
    if (!orderStatus) {
      return res.status(400).json({ status: 'error', message: 'Please provide order status' });
    }

    const order = await Order.findById(req.params.id).populate('buyer', 'name email');

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    // Verify authorized: admin, or seller owning items in the order
    const isSeller = order.items.some((item) => item.seller.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isSeller && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to modify this order status'
      });
    }

    order.orderStatus = orderStatus;
    await order.save();

    // Notify Buyer
    await createNotification(
      order.buyer._id || order.buyer,
      'Order Status Update',
      `Your order #${order._id} status is now updated to: ${orderStatus}.`,
      'order_status'
    );

    // Send Status Update Email
    if (order.buyer && order.buyer.email) {
      sendOrderStatusUpdateEmail(order.buyer.email, order.buyer.name, order._id, orderStatus);
    }

    // Log administrative action
    await logActivity(req.user._id, 'ORDER_STATUS_UPDATE', { orderId: order._id, status: orderStatus }, req.ip);

    res.status(200).json({
      status: 'success',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Stripe Checkout Session
// @route   POST /api/orders/checkout-session
// @access  Private (Buyer only)
export const createCheckoutSession = async (req, res, next) => {
  const { shippingAddress } = req.body;

  try {
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country) {
      return res.status(400).json({ status: 'error', message: 'Please provide complete shipping address details' });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Your shopping cart is empty' });
    }

    // Verify stock first
    for (let item of cart.items) {
      if (!item.product) {
        return res.status(404).json({ status: 'error', message: 'One or more products in your cart no longer exist' });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Insufficient stock for product '${item.product.name}'. Available: ${item.product.stock}`
        });
      }
    }

    // Prepare line items
    const lineItems = cart.items.map((item) => {
      const prod = item.product;
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: prod.name,
            description: prod.description.substring(0, 100),
            images: prod.images && prod.images.length > 0 ? [prod.images[0]] : []
          },
          unit_amount: Math.round(prod.price * 100) // Stripe requires cents
        },
        quantity: item.quantity
      };
    });

    // Calculate subtotal
    const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    // If subtotal is under $100, add flat shipping
    if (subtotal < 100) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping & Handling',
            description: 'Flat rate shipping fee'
          },
          unit_amount: 1000 // $10.00
        },
        quantity: 1
      });
    }

    // Create session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/orders?success=true`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/cart?canceled=true`,
      metadata: {
        userId: req.user._id.toString(),
        shippingAddress: JSON.stringify(shippingAddress)
      }
    });

    res.status(200).json({
      status: 'success',
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Stripe Webhooks
// @route   POST /api/orders/webhook
// @access  Public
export const handleStripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody || req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
    );
  } catch (err) {
    console.error(`Webhook Signature Verification Failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkout session
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const shippingAddress = JSON.parse(session.metadata.shippingAddress);

    try {
      const cart = await Cart.findOne({ user: userId }).populate('items.product');
      if (cart && cart.items.length > 0) {
        const orderItems = [];
        let subtotal = 0;

        for (let item of cart.items) {
          const prod = item.product;
          if (prod) {
            // Decrement stock
            prod.stock = Math.max(0, prod.stock - item.quantity);
            await prod.save();

            orderItems.push({
              product: prod._id,
              name: prod.name,
              price: prod.price,
              quantity: item.quantity,
              seller: prod.seller
            });
            subtotal += prod.price * item.quantity;
          }
        }

        const shipping = subtotal > 100 ? 0 : 10.0;
        const totalAmount = subtotal + shipping;

        // Create Order
        const order = await Order.create({
          buyer: userId,
          items: orderItems,
          totalAmount,
          shippingAddress,
          paymentIntentId: session.payment_intent,
          paymentStatus: 'paid',
          orderStatus: 'pending'
        });

        // Clear Cart
        cart.items = [];
        await cart.save();

        // Get Buyer info for notifications
        const buyer = await User.findById(userId);

        // Notify Buyer
        await createNotification(
          userId,
          'Order Placed Successfully',
          `Your order #${order._id} for $${totalAmount.toFixed(2)} was received. Payment status: Paid.`,
          'order_status'
        );

        if (buyer && buyer.email) {
          sendOrderConfirmationEmail(buyer.email, buyer.name, order);
        }

        // Notify Sellers
        const uniqueSellers = [...new Set(orderItems.map((item) => item.seller.toString()))];
        for (let sellerId of uniqueSellers) {
          await createNotification(
            sellerId,
            'New Order Received',
            `A buyer purchased one or more of your listings in order #${order._id}.`,
            'order_status'
          );
        }

        // Log Administrative / System Audit activity
        await logActivity(userId, 'ORDER_CREATE_STRIPE', { orderId: order._id, total: totalAmount }, 'StripeWebhook');
      }
    } catch (dbErr) {
      console.error('Database Error in Webhook processing:', dbErr.message);
      return res.status(500).json({ error: dbErr.message });
    }
  }

  res.status(200).json({ received: true });
};
