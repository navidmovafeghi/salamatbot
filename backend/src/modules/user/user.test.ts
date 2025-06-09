// backend/src/modules/user/user.test.ts

import request from 'supertest';
import { app } from '../../index'; // Corrected import path for app
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// A helper to generate unique emails for each test run
const generateUniqueEmail = () => `test-${Date.now()}@example.com`;

describe('Authentication Routes', () => {
  // Clean up the database before each test to ensure isolation
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  // Clean up the database after all tests are done
  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const uniqueEmail = generateUniqueEmail();
      const response = await request(app).post('/api/auth/register').send({
        email: uniqueEmail,
        password: 'password123',
      });

      // Assertions
      expect(response.status).toBe(201);
      expect(response.body.email).toBe(uniqueEmail);
      expect(response.body.id).toBeDefined();
      expect(response.body.passwordHash).toBeUndefined(); // Ensure password is not returned
    });

    it('should return 409 Conflict if email is already in use', async () => {
      const uniqueEmail = generateUniqueEmail();
      // First, create the user
      await request(app).post('/api/auth/register').send({
        email: uniqueEmail,
        password: 'password123',
      });

      // Then, try to create it again
      const response = await request(app).post('/api/auth/register').send({
        email: uniqueEmail,
        password: 'password123',
      });

      expect(response.status).toBe(409);
      expect(response.text).toBe('This email is already in use.');
    });

    it('should return 400 Bad Request for an invalid email', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'not-an-email',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body[0].message).toBe('A valid email is required');
    });

    it('should return 400 Bad Request for a short password', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: generateUniqueEmail(),
        password: '123',
      });

      expect(response.status).toBe(400);
      expect(response.body[0].message).toBe(
        'Password must be at least 8 characters long',
      );
    });
  });

  // --- NEW LOGIN TESTS (for Sprint 2) ---
  describe('POST /api/auth/login', () => {
    it('should return an access token for valid credentials', async () => {
      const email = generateUniqueEmail();
      const password = 'password123';

      // ARRANGE: First, create a user to log in with
      await request(app).post('/api/auth/register').send({ email, password });

      // ACT: Now, attempt to log in
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');
    });

    it('should return 401 Unauthorized for an incorrect password', async () => {
      const email = generateUniqueEmail();
      const password = 'password123';

      // ARRANGE
      await request(app).post('/api/auth/register').send({ email, password });

      // ACT
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'wrong-password' });

      // ASSERT
      expect(response.status).toBe(401);
      expect(response.text).toBe('Invalid email or password.');
    });

    it('should return 401 Unauthorized for a non-existent user', async () => {
      // ACT
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nosuchuser@example.com', password: 'any-password' });

      // ASSERT
      expect(response.status).toBe(401);
      expect(response.text).toBe('Invalid email or password.');
    });

    it('should return 400 Bad Request if password is not provided', async () => {
      // ACT
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      // ASSERT
      expect(response.status).toBe(400);
    });
  });
});
