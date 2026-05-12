import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();
// Prefer public DNS for SRV resolution
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function upsertAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@flow.local').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const users = mongoose.connection.collection('users');

  const existing = await users.findOne({ email });
  const hashed = await bcrypt.hash(password, rounds);

  if (!existing) {
    const now = new Date();
    const doc = {
      firstName: process.env.ADMIN_FIRST_NAME || 'FLOW',
      lastName: process.env.ADMIN_LAST_NAME || 'Admin',
      email,
      password: hashed,
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      refreshTokens: [],
      createdAt: now,
      updatedAt: now,
    } as any;
    await users.insertOne(doc);
    console.log('Admin created:', email);
  } else {
    await users.updateOne({ email }, { $set: { password: hashed, isActive: true, isEmailVerified: true, updatedAt: new Date() } });
    console.log('Admin password updated for:', email);
  }

  await mongoose.disconnect();
}

upsertAdmin().catch((e) => { console.error(e); process.exit(1); });
