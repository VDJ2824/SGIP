import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/index.js';
import { User } from '../models/User.js';

async function seedAdmin() {
  const name = process.env.ADMIN_NAME || 'System Admin';
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required to seed the admin');
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }

  await connectDatabase();
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin seed skipped: account already exists');
    return;
  }

  await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    role: 'admin',
    department: 'Administration',
    isEmailVerified: true,
    isActive: true,
    createdByAdmin: false,
    mustChangePassword: false,
  });
  console.log('Admin account created');
}

seedAdmin()
  .catch((error) => {
    console.error(`Admin seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
