import request from 'supertest';
import mongoose from 'mongoose';
import { app, server } from '../src/server.js';
import User from '../src/models/User.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';
import Cart from '../src/models/Cart.js';

describe('Shopping Cart API Endpoints', () => {
  let buyerToken = '';
  let sellerToken = '';
  let adminToken = '';
  let categoryId = '';
  let productId = '';

  const testBuyer = {
    name: 'Test Cart Buyer',
    email: 'buyer-cart@shopez.com',
    password: 'password123',
    role: 'buyer'
  };

  const testSeller = {
    name: 'Test Cart Seller',
    email: 'seller-cart@shopez.com',
    password: 'password123',
    role: 'seller'
  };

  const testAdmin = {
    name: 'Test Cart Admin',
    email: 'admin-cart@shopez.com',
    password: 'password123',
    role: 'admin'
  };

  beforeAll(async () => {
    // Delete any existing test data
    await User.deleteMany({ email: { $in: [testBuyer.email, testSeller.email, testAdmin.email] } });
    await Category.deleteMany({ name: 'Cart Category' });
    await Product.deleteMany({ name: 'Cart Product' });
    await Cart.deleteMany({});

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
      .send({ name: 'Cart Category', description: 'Category for cart testing' });
    categoryId = catRes.body.data._id;

    const prodRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: 'Cart Product',
        description: 'Product for testing cart operations',
        price: 10.0,
        category: categoryId,
        stock: 5, // Small stock to test boundaries
        images: ['https://example.com/cartprod.jpg']
      });
    productId = prodRes.body.data._id;
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({ email: { $in: [testBuyer.email, testSeller.email, testAdmin.email] } });
    await Category.deleteMany({ name: 'Cart Category' });
    await Product.deleteMany({ name: 'Cart Product' });
    await Cart.deleteMany({});

    await mongoose.connection.close();
    await server.close();
  });

  describe('GET /api/cart', () => {
    it('should initialize and return an empty cart for a new buyer', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data.items.length).toBe(0);
    });

    it('should block non-buyers from accessing cart', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/cart/items', () => {
    it('should successfully add an item to the buyer cart', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ productId, quantity: 2 });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].product._id).toBe(productId);
      expect(res.body.data.items[0].quantity).toBe(2);
    });

    it('should increment quantity when adding the same item again', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ productId, quantity: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data.items[0].quantity).toBe(3);
    });

    it('should prevent adding quantity exceeding product stock limit', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ productId, quantity: 3 }); // Total would be 3 + 3 = 6 (exceeds stock of 5)

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('PUT /api/cart/items/:productId', () => {
    it('should update cart item quantity within stock limits', async () => {
      const res = await request(app)
        .put(`/api/cart/items/${productId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ quantity: 4 });

      expect(res.status).toBe(200);
      expect(res.body.data.items[0].quantity).toBe(4);
    });
  });

  describe('DELETE /api/cart/items/:productId', () => {
    it('should successfully remove an item from the cart', async () => {
      const res = await request(app)
        .delete(`/api/cart/items/${productId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });
  });
});
