import dns from 'dns';
try {
  // Fix Windows querySrv ECONNREFUSED issues for MongoDB Atlas connections
  if (process.platform === 'win32') {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch (e) {
  // Ignore in environments where setting DNS servers is restricted
}

import mongoose from 'mongoose';

let cachedConnection = null;

const connectDB = async () => {
  // Reuse existing connection if healthy
  if (cachedConnection && mongoose.connection.readyState >= 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agrisentinel';
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

  try {
    cachedConnection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false
    });
    console.log(`✅ MongoDB Connected successfully: ${cachedConnection.connection.host}`);
    return cachedConnection;
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Error (${maskedUri}): ${error.message}`);
    // Only exit process in non-serverless environment
    if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;
