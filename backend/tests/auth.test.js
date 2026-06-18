import request from 'supertest';
import mongoose from 'mongoose';
import { app, server } from '../src/server.js';
import User from '../src/models/User.js';
import AuditLog from '../src/models/AuditLog.js';

describe('Authentication & User Profile API Endpoints', () => {
  const testUser = {
    name: 'Test Buyer',
    email: 'buyer@shopez.com',
    password: 'password123',
    role: 'buyer'
  };

  let token = '';

  beforeAll(async () => {
    // Empty users database before running tests
    await User.deleteMany({ email: { $in: [testUser.email, 'admin@shopez.com'] } });
    await AuditLog.deleteMany({});
  });

  afterAll(async () => {
    // Cleanup users database
    await User.deleteMany({ email: { $in: [testUser.email, 'admin@shopez.com'] } });
    await AuditLog.deleteMany({});
    
    // Close database connection and Express server
    await mongoose.connection.close();
    await server.close();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new buyer user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toHaveProperty('name', testUser.name);
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).toHaveProperty('role', 'buyer');
    });

    it('should fail to register a user with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('already registered');
    });

    it('should fail if registering an admin account directly', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Admin User',
          email: 'admin@shopez.com',
          password: 'password123',
          role: 'admin'
        });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in the test user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body).toHaveProperty('accessToken');
      token = res.body.accessToken;
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/users/profile', () => {
    it('should retrieve profile details when logged in', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('email', testUser.email);
    });

    it('should block profile access without a token', async () => {
      const res = await request(app)
        .get('/api/users/profile');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update profile name and avatar', async () => {
      const updatedName = 'Updated Buyer Name';
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: updatedName });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('name', updatedName);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });
});
