import request from 'supertest';
import mongoose from 'mongoose';
import { app, server } from '../src/server.js';
import User from '../src/models/User.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import AuditLog from '../src/models/AuditLog.js';

describe('Admin Dashboard Operations API Endpoints', () => {
  let buyerId = '';
  let productId = '';
  let adminToken = '';
  let sellerToken = '';
  let buyerToken = '';

  const testBuyer = {
    name: 'Test Admin-Ops Buyer',
    email: 'buyer-adminops@shopez.com',
    password: 'password123',
    role: 'buyer'
  };

  const testSeller = {
    name: 'Test Admin-Ops Seller',
    email: 'seller-adminops@shopez.com',
    password: 'password123',
    role: 'seller'
  };

  const testAdmin = {
    name: 'Test Admin-Ops Admin',
    email: 'admin-adminops@shopez.com',
    password: 'password123',
    role: 'admin'
  };

  beforeAll(async () => {
    // Delete existing test records
    await User.deleteMany({ email: { $in: [testBuyer.email, testSeller.email, testAdmin.email] } });
    await Category.deleteMany({ name: 'Admin Category' });
    await Product.deleteMany({ name: 'Admin Product' });
    await Order.deleteMany({});
    await AuditLog.deleteMany({});

    // Direct insert of test accounts
    const buyer = await User.create(testBuyer);
    buyerId = buyer._id;

    const seller = await User.create(testSeller);
    const admin = await User.create(testAdmin);

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
    const cat = await Category.create({ name: 'Admin Category', description: 'Admin testing category' });
    const prod = await Product.create({
      name: 'Admin Product',
      description: 'Admin testing product',
      price: 15.00,
      category: cat._id,
      stock: 10,
      images: ['https://example.com/adminprod.jpg'],
      seller: seller._id
    });
    productId = prod._id;
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({ email: { $in: [testBuyer.email, testSeller.email, testAdmin.email] } });
    await Category.deleteMany({ name: 'Admin Category' });
    await Product.deleteMany({ name: 'Admin Product' });
    await Order.deleteMany({});
    await AuditLog.deleteMany({});

    await mongoose.connection.close();
    await server.close();
  });

  describe('GET /api/admin/dashboard/stats', () => {
    it('should allow Admin to retrieve system stats', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('userCounts');
      expect(res.body.data).toHaveProperty('productCounts');
    });

    it('should block non-admins (Sellers) from accessing stats', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should allow Admin to retrieve users list', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/admin/users/:id/status', () => {
    it('should allow Admin to suspend a user', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${buyerId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'suspended' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('suspended');

      // Verify the suspended user is blocked from logging in
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testBuyer.email,
        password: testBuyer.password
      });
      expect(loginRes.status).toBe(403);
      expect(loginRes.body.message).toContain('suspended');
    });

    it('should allow Admin to reactivate a suspended user', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${buyerId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');

      // Verify user can log in again
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testBuyer.email,
        password: testBuyer.password
      });
      expect(loginRes.status).toBe(200);
    });
  });

  describe('PUT /api/admin/products/:id/status', () => {
    it('should allow Admin to reject a product listing', async () => {
      const res = await request(app)
        .put(`/api/admin/products/${productId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'rejected' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('rejected');

      // Verify product is no longer returned in public feed
      const feedRes = await request(app).get('/api/products');
      const found = feedRes.body.data.some(p => p._id === productId.toString());
      expect(found).toBe(false);
    });
  });

  describe('GET /api/admin/audit-logs', () => {
    it('should retrieve activity audit trails for admin review', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('action');
    });
  });
});
