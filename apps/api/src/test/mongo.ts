import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Spin up an in-memory Mongo for the entire test file. Faster than a real
// container and lets tests run in parallel without colliding on state.
let mongo: MongoMemoryServer | null = null;

export async function startInMemoryMongo(): Promise<string> {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
  return uri;
}

export async function stopInMemoryMongo(): Promise<void> {
  await mongoose.disconnect();
  await mongo?.stop();
  mongo = null;
}

export async function clearAllCollections(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const c of Object.values(collections)) {
    await c.deleteMany({});
  }
}
