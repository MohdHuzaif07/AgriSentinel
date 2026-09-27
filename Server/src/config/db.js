import dns from 'dns';
// Fix Windows querySrv ECONNREFUSED issues for MongoDB Atlas connections
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agrisentinel';
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Error (${maskedUri}): ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
