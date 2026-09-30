const mongoose = require('mongoose');
const { env } = require('./env');

async function startMemoryServer() {
  if (process.env.VERCEL || env.nodeEnv === 'production') {
    throw new Error('MONGO_URI is required. Use a MongoDB Atlas connection string on Vercel.');
  }

  let MongoMemoryServer;
  try {
    ({ MongoMemoryServer } = require('mongodb-memory-server'));
  } catch (error) {
    throw new Error('Set MONGO_URI to a MongoDB connection string. An in-memory fallback is only available in development.');
  }

  const memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri();
  await mongoose.connect(uri);
  console.log('Connected to an in-memory MongoDB for local development.');
  return memoryServer;
}

async function connectDB() {
  if (env.nodeEnv === 'production' && !env.mongoUri) {
    throw new Error('MONGO_URI is required in production');
  }

  if (!env.mongoUri || env.mongoUri === 'memory') {
    return startMemoryServer();
  }

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 2500 });
    console.log('Connected to MongoDB');
    return null;
  } catch (error) {
    if (env.nodeEnv === 'production') throw error;
    console.warn(`MongoDB at ${env.mongoUri} is unavailable (${error.message}).`);
    console.warn('Starting an in-memory database so the demo can run.');
    return startMemoryServer();
  }
}

module.exports = { connectDB };
