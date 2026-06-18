import request from 'supertest';
import mongoose from 'mongoose';
import { app, server } from '../src/server.js';
import User from '../src/models/User.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';
import Cart from '../src/models/Cart.js';
import Order from '../src/models/Order.js';
import Notification from '../src/models/Notification.js';
import AuditLog from '../src/models/AuditLog.js';

describe('Order & Checkout API Endpoints', () => {
  let buyerToken = '';
  let sellerToken = '';
  let adminToken = '';
  let categoryId = '';
  let productId = '';
  let orderId = '';

  const testBuyer = {
    name: 'Test Order Buyer',
    email: 'buyer-order@shopez.com',
    password: 'password123',
    role: 'buyer'
  };

  const testSeller = {
    name: 'Test Order Seller',
    email: 'seller-order@shopez.com',
    password: 'password123',
    role: 'seller'
  };

  const testAdmin = {
    name: 'Test Order Admin',
    email: 'admin-order@shopez.com',
    password: 'password123',
    role: 'admin'
  };

  const shippingAddress = {
    street: '123 E-Commerce Way',
    city: 'Tech City',
    state: 'State of Art',
    zipCode: '10101',
    country: 'Marketplace land'
  };

  beforeAll(async () => {
    // Delete existing records
    await User.deleteMany({ email: { $in: [testBuyer.email, testSeller.email, testAdmin.email] } });
    await Category.deleteMany({ name: 'Order Category' });
    await Product.deleteMany({ name: 'Order Product' });
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});

    // Direct insert of test accounts
    const buyerUser = await User.create(testBuyer);
    const sellerUser = await User.create(testSeller);
    const adminUser = await User.create(testAdmin);

    // Get Auth Tokens
    const buyerLogin = await request(app).post('/api/auth/login').send({
      email: testBuyer.email,
      password: testBuyer.password
    });
    buyerToken = buyerLogin.body.accessToken;

    const sellerLogin = await request(app).post('/api/auth/login').send({
      email: testSeller.email,
      password: testSeller.password
    });
    sellerToken = sellerLogin.body.accessToken;

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: testAdmin.email,
      password: testAdmin.password
    });
    adminToken = adminLogin.body.accessToken;

    // Create Category & Product
    const catRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Order Category', description: 'Category for order testing' });
    categoryId = catRes.body.data._id;

    const prodRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: 'Order Product',
        description: 'Product for testing order placement',
        price: 25.0,
        category: categoryId,
        stock: 10,
        images: ['https://example.com/orderprod.jpg']
      });
    productId = prodRes.body.data._id;
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({ email: { $in: [testBuyer.email, testSeller.email, testAdmin.email] } });
    await Category.deleteMany({ name: 'Order Category' });
    await Product.deleteMany({ name: 'Order Product' });
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});

    await mongoose.connection.close();
    await server.close();
  });

  describe('POST /api/orders', () => {
    it('should successfully place a mock order and clear the cart', async () => {
      // 1. Add item to cart
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ productId, quantity: 2 });

      // 2. Perform Checkout
      const checkoutRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ shippingAddress });

      expect(checkoutRes.status).toBe(201);
      expect(checkoutRes.body.status).toBe('success');
      expect(checkoutRes.body.data).toHaveProperty('paymentStatus', 'paid');
      expect(checkoutRes.body.data.items.length).toBe(1);
      expect(checkoutRes.body.data.items[0].product).toBe(productId);
      
      orderId = checkoutRes.body.data._id;

      // 3. Verify stock is decremented by 2 (10 - 2 = 8)
      const updatedProd = await Product.findById(productId);
      expect(updatedProd.stock).toBe(8);

      // 4. Verify cart is empty
      const cartRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(cartRes.body.data.items.length).toBe(0);

      // 5. Verify notifications were created
      const buyerNotifs = await Notification.find({ title: 'Order Placed Successfully' });
      expect(buyerNotifs.length).toBe(1);
    });

    it('should deny checkout if shipping address is missing', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/orders/my-orders', () => {
    it('should retrieve buyer order history', async () => {
      const res = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]._id).toBe(orderId);
    });
  });

  describe('GET /api/orders/seller-orders', () => {
    it('should retrieve seller orders containing their products', async () => {
      const res = await request(app)
        .get('/api/orders/seller-orders')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]._id).toBe(orderId);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should allow buyer to retrieve order details', async () => {
      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(orderId);
    });

    it('should block unauthorized users from viewing order details', async () => {
      // Create another guest user
      const guest = await User.create({
        name: 'Guest User',
        email: 'guest@shopez.com',
        password: 'password123',
        role: 'buyer'
      });
      const login = await request(app).post('/api/auth/login').send({
        email: guest.email,
        password: 'password123'
      });
      const guestToken = login.body.accessToken;

      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${guestToken}`);

      expect(res.status).toBe(403);
      
      // Cleanup guest user
      await User.findByIdAndDelete(guest._id);
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    it('should allow seller or admin to update status', async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ orderStatus: 'processing' });

      expect(res.status).toBe(200);
      expect(res.body.data.orderStatus).toBe('processing');

      // Verify status update notification was sent to buyer
      const statusNotifs = await Notification.find({ title: 'Order Status Update' });
      expect(statusNotifs.length).toBe(1);
    });
  });
});
