import app from '../Server/src/app.js';
import connectDB from '../Server/src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.error('Vercel Serverless Function DB Error:', err.message);
    return res.status(500).json({
      message: 'Database connection failed. Please check MONGODB_URI in Vercel environment variables.',
      error: err.message
    });
  }
}
