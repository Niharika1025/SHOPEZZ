import request from 'supertest';
import mongoose from 'mongoose';
import { app, server } from '../src/server.js';
import User from '../src/models/User.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';
import Cart from '../src/models/Cart.js';
import Order from '../src/models/Order.js';
import Review from '../src/models/Review.js';
import AuditLog from '../src/models/AuditLog.js';

describe('Reviews & Ratings API Endpoints', () => {
  let buyerToken = '';
  let sellerToken = '';
  let adminToken = '';
  let categoryId = '';
  let productId = '';
  let reviewId = '';

  const testBuyer = {
    name: 'Test Review Buyer',
    email: 'buyer-review@shopez.com',
    password: 'password123',
    role: 'buyer'
  };

  const testSeller = {
    name: 'Test Review Seller',
    email: 'seller-review@shopez.com',
    password: 'password123',
    role: 'seller'
  };

  const testAdmin = {
    name: 'Test Review Admin',
    email: 'admin-review@shopez.com',
    password: 'password123',
    role: 'admin'
  };

  const shippingAddress = {
    street: '456 Review St',
    city: 'Rating City',
    state: 'Evaluation State',
    zipCode: '20202',
    country: 'Audit Land'
  };

  beforeAll(async () => {
    // Delete existing records
    await User.deleteMany({ email: { $in: [testBuyer.email, testSeller.email, testAdmin.email] } });
    await Category.deleteMany({ name: 'Review Category' });
    await Product.deleteMany({ name: 'Review Product' });
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
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
      .send({ name: 'Review Category', description: 'Category for review testing' });
    categoryId = catRes.body.data._id;

    const prodRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: 'Review Product',
        description: 'Product for testing review submissions',
        price: 35.0,
        category: categoryId,
        stock: 5,
        images: ['https://example.com/reviewprod.jpg']
      });
    productId = prodRes.body.data._id;
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({ email: { $in: [testBuyer.email, testSeller.email, testAdmin.email] } });
    await Category.deleteMany({ name: 'Review Category' });
    await Product.deleteMany({ name: 'Review Product' });
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    await AuditLog.deleteMany({});

    await mongoose.connection.close();
    await server.close();
  });

  describe('POST /api/reviews', () => {
    it('should block review submission if buyer has not purchased the product', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          productId,
          rating: 5,
          comment: 'Outstanding product!'
        });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('verified buyers');
    });

    it('should allow review submission after buyer purchases product', async () => {
      // 1. Purchase product
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ productId, quantity: 1 });

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ shippingAddress });

      // 2. Submit Review
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          productId,
          rating: 4,
          comment: 'Pretty good product, matches expectations.'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.rating).toBe(4);
      expect(res.body.data.comment).toBe('Pretty good product, matches expectations.');
      
      reviewId = res.body.data._id;

      // 3. Verify product average ratings recalculated (should be 4.0 average, count 1)
      const updatedProd = await Product.findById(productId);
      expect(updatedProd.ratings.average).toBe(4);
      expect(updatedProd.ratings.count).toBe(1);
    });

    it('should prevent duplicate review submission by the same user', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          productId,
          rating: 5,
          comment: 'Another comment'
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/reviews/product/:productId', () => {
    it('should retrieve list of product reviews', async () => {
      const res = await request(app)
        .get(`/api/reviews/product/${productId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]._id).toBe(reviewId);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('should allow review owner or admin to delete the review', async () => {
      const res = await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      // Verify product ratings recalculated back to 0 average and 0 count
      const updatedProd = await Product.findById(productId);
      expect(updatedProd.ratings.average).toBe(0);
      expect(updatedProd.ratings.count).toBe(0);
    });
  });
});
