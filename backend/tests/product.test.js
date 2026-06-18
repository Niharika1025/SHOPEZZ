import request from 'supertest';
import mongoose from 'mongoose';
import { app, server } from '../src/server.js';
import User from '../src/models/User.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';
import AuditLog from '../src/models/AuditLog.js';

describe('Category & Product API Endpoints', () => {
  let adminToken = '';
  let sellerToken = '';
  let categoryId = '';
  let productId = '';

  const testAdmin = {
    name: 'Test Admin',
    email: 'admin-prod@shopez.com',
    password: 'password123',
    role: 'admin'
  };

  const testSeller = {
    name: 'Test Seller',
    email: 'seller-prod@shopez.com',
    password: 'password123',
    role: 'seller'
  };

  beforeAll(async () => {
    // Delete any existing test data
    await User.deleteMany({ email: { $in: [testAdmin.email, testSeller.email] } });
    await Category.deleteMany({ name: 'Test Category' });
    await Product.deleteMany({ name: 'Test Product' });
    await AuditLog.deleteMany({});

    // Direct insert of test accounts (by-passing self-register block for admin)
    const adminUser = await User.create(testAdmin);
    const sellerUser = await User.create(testSeller);

    // Fetch tokens
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: testAdmin.email,
      password: testAdmin.password
    });
    adminToken = adminLogin.body.accessToken;

    const sellerLogin = await request(app).post('/api/auth/login').send({
      email: testSeller.email,
      password: testSeller.password
    });
    sellerToken = sellerLogin.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({ email: { $in: [testAdmin.email, testSeller.email] } });
    await Category.deleteMany({ name: 'Test Category' });
    await Product.deleteMany({ name: 'Test Product' });
    await AuditLog.deleteMany({});

    await mongoose.connection.close();
    await server.close();
  });

  describe('POST /api/categories', () => {
    it('should allow Admin to create a category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Category',
          description: 'Category for unit tests'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('slug', 'test-category');
      categoryId = res.body.data._id;
    });

    it('should deny category creation for non-admins (Seller)', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          name: 'Hack Category'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/products', () => {
    it('should allow Sellers to create a product listing', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          name: 'Test Product',
          description: 'A product for testing catalog features',
          price: 49.99,
          category: categoryId,
          stock: 10,
          images: ['https://example.com/testproduct.jpg']
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('name', 'Test Product');
      productId = res.body.data._id;
    });

    it('should deny product creation for unauthorized users', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({
          name: 'Guest Product',
          price: 10
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/products', () => {
    it('should retrieve list of approved products', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter products by query parameter filters', async () => {
      const res = await request(app)
        .get('/api/products')
        .query({ search: 'Test', minPrice: 10, maxPrice: 100 });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('name', 'Test Product');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should allow product owner (seller) to update listing details', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ price: 39.99, stock: 15 });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('price', 39.99);
      expect(res.body.data).toHaveProperty('stock', 15);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should allow admin or owner to delete a product listing', async () => {
      const res = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });
});
