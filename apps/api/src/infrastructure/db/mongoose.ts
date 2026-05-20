import mongoose from 'mongoose';
import { env } from '../../config/env.js';
import { logger } from '../logger/logger.js';

// Single connection per process. Mongoose pools internally.
let connected = false;

export async function connectMongo(uri: string = env.MONGO_URI): Promise<void> {
  if (connected) return;
  // strictQuery: forbid querying by undefined fields — surfaces typos as errors.
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  connected = true;
  logger.info({ uri: uri.replace(/\/\/.*@/, '//***@') }, 'Mongo connected');
}

export async function disconnectMongo(): Promise<void> {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}
