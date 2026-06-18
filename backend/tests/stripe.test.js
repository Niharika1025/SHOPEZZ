import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { app, server } from '../src/server.js';
import User from '../src/models/User.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';
import Cart from '../src/models/Cart.js';
import Order from '../src/models/Order.js';
import Notification from '../src/models/Notification.js';
import stripe from '../src/config/stripe.js';

describe('Stripe Checkout & Webhook API Endpoints', () => {
  let buyerId = '';
  let productId = '';
  let buyerToken = '';
  let sellerToken = '';
  let adminToken = '';
  let categoryId = '';

  const testBuyer = {
    name: 'Test Stripe Buyer',
    email: 'buyer-stripe@shopez.com',
    password: 'password123',
    role: 'buyer'
  };

  const testSeller = {
    name: 'Test Stripe Seller',
    email: 'seller-stripe@shopez.com',
    password: 'password123',
    role: 'seller'
  };

  const testAdmin = {
    name: 'Test Stripe Admin',
    email: 'admin-stripe@shopez.com',
    password: 'password123',
    role: 'admin'
  };

  const shippingAddress = {
    street: '123 Stripe St',
    city: 'Card City',
    state: 'Payment State',
    zipCode: '40404',
    country: 'Stripe Land'
  };

  beforeAll(async () => {
    // Delete existing test data
    await User.deleteMany({ email: { $in: [testBuyer.email, testSeller.email, testAdmin.email] } });
    await Category.deleteMany({ name: 'Stripe Category' });
    await Product.deleteMany({ name: 'Stripe Product' });
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await Notification.deleteMany({});

    // Direct insert of test accounts
    const buyerUser = await User.create(testBuyer);
    buyerId = buyerUser._id.toString();

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
      .send({ name: 'Stripe Category', description: 'Category for Stripe testing' });
    categoryId = catRes.body.data._id;

    const prodRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: 'Stripe Product',
        description: 'Product for testing Stripe checkout',
        price: 50.0,
        category: categoryId,
        stock: 10,
        images: ['https://example.com/stripeprod.jpg']
      });
    productId = prodRes.body.data._id;
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({ email: { $in: [testBuyer.email, testSeller.email, testAdmin.email] } });
    await Category.deleteMany({ name: 'Stripe Category' });
    await Product.deleteMany({ name: 'Stripe Product' });
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await Notification.deleteMany({});

    await mongoose.connection.close();
    await server.close();
  });

  describe('POST /api/orders/checkout-session', () => {
    it('should generate a Stripe checkout session url and ID', async () => {
      // 1. Add item to cart
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ productId, quantity: 2 });

      // 2. Mock Stripe Checkout Session API call
      const spy = jest.spyOn(stripe.checkout.sessions, 'create').mockImplementation(() => {
        return Promise.resolve({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/pay/cs_test_123'
        });
      });

      // 3. Request Checkout Session
      const res = await request(app)
        .post('/api/orders/checkout-session')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ shippingAddress });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body).toHaveProperty('url', 'https://checkout.stripe.com/pay/cs_test_123');
      expect(res.body).toHaveProperty('sessionId', 'cs_test_123');

      spy.mockRestore();
    });
  });

  describe('POST /api/orders/webhook', () => {
    it('should process paid checkout completion webhook event and create order', async () => {
      // Mock stripe webhook signature check to return our custom mock session event
      const constructEventSpy = jest.spyOn(stripe.webhooks, 'constructEvent').mockImplementation(() => {
        return {
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_123',
              amount_total: 11000, // $100 subtotal + $10 shipping
              payment_intent: 'pi_test_123',
              metadata: {
                userId: buyerId,
                shippingAddress: JSON.stringify(shippingAddress)
              }
            }
          }
        };
      });

      const res = await request(app)
        .post('/api/orders/webhook')
        .set('stripe-signature', 'mock_signature')
        .send({ mock: 'event_body' }); // Sending raw body trigger

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('received', true);

      // Verify DB Changes:
      // 1. Order created in database
      const order = await Order.findOne({ buyer: buyerId });
      expect(order).toBeTruthy();
      expect(order.paymentStatus).toBe('paid');
      expect(order.totalAmount).toBe(110);
      expect(order.items[0].product.toString()).toBe(productId);

      // 2. Cart cleared
      const cart = await Cart.findOne({ user: buyerId });
      expect(cart.items.length).toBe(0);

      // 3. Stock reduced (10 - 2 = 8)
      const product = await Product.findById(productId);
      expect(product.stock).toBe(8);

      constructEventSpy.mockRestore();
    });
  });
});
