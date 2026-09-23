/**
 * mlQueue.js — BullMQ / Redis integration
 *
 * Redis is OPTIONAL for the development demo.
 * If Redis is not running, queue operations are silently skipped and
 * the report is still saved to MongoDB. The ML job will be marked FAILED
 * with reason "Queue unavailable". This is expected behaviour in dev.
 *
 * To enable: install and run Redis, then restart the server.
 */

import dotenv from 'dotenv';
dotenv.config();

let mlQueue = null;
let isRedisAvailable = false;

// Only attempt Redis connection if the env var is explicitly set or default
const initQueue = async () => {
  try {
    const { Queue } = await import('bullmq');
    const { default: IORedis } = await import('ioredis');

    const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,   // Don't queue commands when disconnected
      lazyConnect: true,           // Don't connect immediately on instantiation
      retryStrategy: (times) => {
        if (times > 2) return null; // Give up after 2 retries
        return 500;
      }
    });

    // Try to actually connect
    await connection.connect();
    
    mlQueue = new Queue('ml-image-processing', { connection });
    isRedisAvailable = true;
    console.log('✅ Redis connected — ML job queue is active');
  } catch (err) {
    console.warn('⚠️  Redis unavailable — ML queue disabled. Reports will still be saved to MongoDB.');
    isRedisAvailable = false;
  }
};

// Fire-and-forget init — won't crash the server if it fails
initQueue();

export const addMlJob = async (reportId, imageReference) => {
  if (!isRedisAvailable || !mlQueue) {
    console.warn(`[Queue] Skipping job for report ${reportId} — Redis not available`);
    return null;
  }

  try {
    const job = await mlQueue.add('process-image', {
      reportId,
      imageReference
    }, {
      attempts: 3,                 // retry up to 3 times on failure
      backoff: { type: 'exponential', delay: 1000 }
    });
    console.log(`[Queue] Job ${job.id} queued for report ${reportId}`);
    return job;
  } catch (error) {
    console.error('[Queue] Failed to add job:', error.message);
    return null;
  }
};

export { mlQueue, isRedisAvailable };
