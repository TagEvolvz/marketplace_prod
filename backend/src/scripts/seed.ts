/**
 * seed.ts — Seeds the admin account and store categories
 * Run: npm run seed:admin
 */
import dotenv from 'dotenv';
import dns from 'dns';
dotenv.config();

// Ensure SRV DNS lookups succeed even if local resolver is flaky
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Category } from '../models/index';

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log('Connected to MongoDB');

  // ─── Admin account ──────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@flow.com';
  const existing   = await User.findOne({ email: adminEmail });

  if (existing) {
    console.log(`Admin already exists: ${adminEmail}`);
  } else {
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12);
    await User.create({
      firstName:       process.env.ADMIN_FIRST_NAME || 'FLOW',
      lastName:        process.env.ADMIN_LAST_NAME  || 'Admin',
      email:           adminEmail,
      password:        hashed,
      role:            'admin',
      isActive:        true,
      isEmailVerified: true,
      refreshTokens:   [],
    });
    console.log(`Admin created: ${adminEmail}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((e) => { console.error(e.message); process.exit(1); });
