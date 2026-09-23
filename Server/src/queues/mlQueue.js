import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    // Retry a few times, then give up so we don't crash the server if Redis isn't running locally
    if (times > 3) {
      console.warn("Redis connection failed. Ensure Redis is running.");
      return null;
    }
    return Math.min(times * 50, 2000);
  }
});

connection.on('error', (err) => {
  console.warn("Redis warning: ", err.message);
});

export const mlQueue = new Queue('ml-image-processing', { connection });

export const addMlJob = async (reportId, imageReference) => {
  try {
    const job = await mlQueue.add('process-image', {
      reportId,
      imageReference
    });
    return job;
  } catch (error) {
    console.error("Failed to add job to queue:", error);
    throw error;
  }
};
