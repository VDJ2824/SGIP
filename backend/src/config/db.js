import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGO_URI);
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
