import request from 'supertest';
import mongoose from 'mongoose';
import { app, server } from '../src/server.js';
import User from '../src/models/User.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';
import Cart from '../src/models/Cart.js';
import Order from '../src/models/Order.js';
import AuditLog from '../src/models/AuditLog.js';

describe('Seller Dashboard Analytics API Endpoints', () => {
  let buyerToken = '';
  let sellerToken = '';
  let adminToken = '';
  let categoryId = '';
  let productId = '';

  const testBuyer = {
    name: 'Test Seller-Dashboard Buyer',
    email: 'buyer-dash@shopez.com',
    password: 'password123',
    role: 'buyer'
  };

  const testSeller = {
    name: 'Test Seller-Dashboard Seller',
    email: 'seller-dash@shopez.com',
    password: 'password123',
    role: 'seller'
  };

  const testAdmin = {
    name: 'Test Seller-Dashboard Admin',
    email: 'admin-dash@shopez.com',
    password: 'password123',
    role: 'admin'
  };

  const shippingAddress = {
    street: '789 Dashboard Ave',
    city: 'Stat City',
    state: 'Analytics State',
    zipCode: '30303',
    country: 'Report Land'
  };

  beforeAll(async () => {
    // Delete existing records
    await User.deleteMany({ email: { $in: [testBuyer.email, testSeller.email, testAdmin.email] } });
    await Category.deleteMany({ name: 'Dash Category' });
    await Product.deleteMany({ name: 'Dash Product' });
    await Cart.deleteMany({});
    await Order.deleteMany({});
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
      .send({ name: 'Dash Category', description: 'Category for seller dashboard testing' });
    categoryId = catRes.body.data._id;

    const prodRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: 'Dash Product',
        description: 'Product for testing seller analytics',
        price: 100.0,
        category: categoryId,
        stock: 20,
        images: ['https://example.com/dashprod.jpg']
      });
    productId = prodRes.body.data._id;

    // Purchase product to generate sales stats
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId, quantity: 2 });

    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ shippingAddress });
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({ email: { $in: [testBuyer.email, testSeller.email, testAdmin.email] } });
    await Category.deleteMany({ name: 'Dash Category' });
    await Product.deleteMany({ name: 'Dash Product' });
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await AuditLog.deleteMany({});

    await mongoose.connection.close();
    await server.close();
  });

  describe('GET /api/seller/dashboard/stats', () => {
    it('should successfully retrieve correct metrics and charts for seller', async () => {
      const res = await request(app)
        .get('/api/seller/dashboard/stats')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.metrics).toHaveProperty('totalRevenue', 200); // 2 * $100
      expect(res.body.data.metrics).toHaveProperty('totalItemsSold', 2);
      expect(res.body.data.metrics).toHaveProperty('totalOrders', 1);
      expect(res.body.data.metrics).toHaveProperty('totalProducts', 1);
      expect(res.body.data.chartData.length).toBeGreaterThan(0);
      expect(res.body.data.products.length).toBe(1);
    });

    it('should block non-sellers (Buyer) from accessing stats', async () => {
      const res = await request(app)
        .get('/api/seller/dashboard/stats')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
