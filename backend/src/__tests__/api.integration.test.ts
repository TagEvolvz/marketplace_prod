import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import { User } from '../models/User';
import { Category } from '../models/index';

vi.mock('../utils/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  emailTemplates: {
    welcomeEmail: vi.fn().mockReturnValue({ subject: 'Test', html: '<p>Test</p>' }),
  },
}));

vi.mock('../config/redis', () => ({
  connectRedis: vi.fn().mockResolvedValue(null),
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(null),
  cacheDel: vi.fn().mockResolvedValue(null),
  cacheDelPattern: vi.fn().mockResolvedValue(null),
}));

const MONGO_URI = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace_test';

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({});
});

// ─── Health Check ─────────────────────────────────────────────────────────────
describe('GET /api/v1/health', () => {
  it('returns 200 with status info', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('FLOW API is running');
  });
});

// ─── Auth Routes ──────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/register', () => {
  it('registers a new user and returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com', password: 'Password123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('returns 409 on duplicate email', async () => {
    await request(app).post('/api/v1/auth/register')
      .send({ firstName: 'A', lastName: 'B', email: 'dup@test.com', password: 'Password123' });

    const res = await request(app).post('/api/v1/auth/register')
      .send({ firstName: 'C', lastName: 'D', email: 'dup@test.com', password: 'Password123' });

    expect(res.status).toBe(409);
  });

  it('returns 400 on missing fields', async () => {
    const res = await request(app).post('/api/v1/auth/register')
      .send({ email: 'incomplete@test.com' });
    expect(res.status).toBe(400);
  });

  it('returns 400 on weak password', async () => {
    const res = await request(app).post('/api/v1/auth/register')
      .send({ firstName: 'A', lastName: 'B', email: 'weak@test.com', password: 'weak' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register')
      .send({ firstName: 'Test', lastName: 'User', email: 'user@test.com', password: 'Password123' });
    await User.findOneAndUpdate({ email: 'user@test.com' }, { isEmailVerified: true });
  });

  it('returns 200 with access token on valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login')
      .send({ email: 'user@test.com', password: 'Password123' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.email).toBe('user@test.com');
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login')
      .send({ email: 'user@test.com', password: 'WrongPass123' });
    expect(res.status).toBe(401);
  });

  it('returns 401 on unknown user', async () => {
    const res = await request(app).post('/api/v1/auth/login')
      .send({ email: 'nobody@test.com', password: 'Password123' });
    expect(res.status).toBe(401);
  });
});

// ─── Protected Routes ─────────────────────────────────────────────────────────
describe('GET /api/v1/auth/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns user profile with valid token', async () => {
    await request(app).post('/api/v1/auth/register')
      .send({ firstName: 'Me', lastName: 'User', email: 'me@test.com', password: 'Password123' });
    await User.findOneAndUpdate({ email: 'me@test.com' }, { isEmailVerified: true });

    const loginRes = await request(app).post('/api/v1/auth/login')
      .send({ email: 'me@test.com', password: 'Password123' });

    const token = loginRes.body.data.accessToken;
    const res = await request(app).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('me@test.com');
  });
});

// ─── Categories ───────────────────────────────────────────────────────────────
describe('GET /api/v1/categories', () => {
  beforeAll(async () => {
    await Category.deleteMany({});
    await Category.create([
      { name: 'Electronics', slug: 'electronics', storeSection: 'pharmacy' },
      { name: 'Fashion', slug: 'fashion', storeSection: 'pharmacy' },
    ]);
  });

  it('returns list of categories', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── Admin Protected ─────────────────────────────────────────────────────────
describe('GET /api/v1/admin/dashboard', () => {
  it('returns 403 for non-admin user', async () => {
    await request(app).post('/api/v1/auth/register')
      .send({ firstName: 'Cust', lastName: 'User', email: 'cust2@test.com', password: 'Password123' });
    await User.findOneAndUpdate({ email: 'cust2@test.com' }, { isEmailVerified: true });

    const loginRes = await request(app).post('/api/v1/auth/login')
      .send({ email: 'cust2@test.com', password: 'Password123' });

    const token = loginRes.body.data.accessToken;
    const res = await request(app).get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 200 for admin user', async () => {
    await User.create({
      firstName: 'Admin', lastName: 'User', email: 'admin-test@test.com',
      password: 'Admin@123456', role: 'admin', isEmailVerified: true, isActive: true,
    });

    const loginRes = await request(app).post('/api/v1/auth/login')
      .send({ email: 'admin-test@test.com', password: 'Admin@123456' });

    const token = loginRes.body.data.accessToken;
    const res = await request(app).get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
