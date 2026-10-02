/**
 * mlWorker.js — ML Worker & Processing Pipeline
 *
 * Consumes jobs from the BullMQ 'ml-image-processing' queue when Redis is available.
 * Also exports `processMLForReport` for direct asynchronous processing if Redis is unavailable.
 *
 * For each report:
 *   1. Sends image to FastAPI /predict (PyTorch ResNet-50)
 *   2. Receives disease + confidence
 *   3. Looks up treatment from structured Knowledge Base
 *   4. Updates Report in MongoDB (disease, confidence, treatment, status=ANALYZED)
 *   5. Updates MLJob record (status=COMPLETED)
 *   6. Emits Socket.IO 'report:analyzed' for real-time officer dashboard update
 *   7. Emits Socket.IO 'report:result:{farmerId}' for farmer notification
 */

import dotenv from 'dotenv';
dotenv.config();

import fetch from 'node-fetch';
import FormData from 'form-data';
import Report from '../models/Report.js';
import MLJob from '../models/MLJob.js';
import { getTreatmentByDisease } from '../data/treatments.js';

let worker = null;
let isWorkerActive = false;

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Call FastAPI /predict endpoint with image buffer/base64
 */
export const callMLService = async (imageReference) => {
  try {
    let imageBuffer;
    let mimeType = 'image/jpeg';

    if (imageReference && imageReference.startsWith('data:image')) {
      const [header, base64Data] = imageReference.split(',');
      mimeType = header.split(':')[1]?.split(';')[0] || 'image/jpeg';
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (imageReference && (imageReference.startsWith('http://') || imageReference.startsWith('https://'))) {
      const imgRes = await fetch(imageReference);
      imageBuffer = Buffer.from(await imgRes.arrayBuffer());
      mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
    } else {
      // 1x1 blank image placeholder for test reports
      imageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      mimeType = 'image/png';
    }

    const ext = mimeType.split('/')[1] || 'jpg';
    const form = new FormData();
    form.append('file', imageBuffer, { filename: `crop.${ext}`, contentType: mimeType });

    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
      timeout: 30000
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ML service returned ${response.status}: ${errText}`);
    }

    return await response.json();
  } catch (err) {
    throw new Error(`ML service call failed: ${err.message}`);
  }
};

/**
 * Core processing function for a single report.
 * Called either by BullMQ worker OR by asynchronous direct fallback.
 */
export const processMLForReport = async (reportId, imageReference, io) => {
  console.log(`[ML Pipeline] Processing ML diagnosis for report ${reportId}...`);

  // Update MLJob to PROCESSING
  const mlJob = await MLJob.findOne({ reportId });
  if (mlJob) {
    mlJob.status = 'PROCESSING';
    mlJob.startedAt = new Date();
    await mlJob.save();
  }

  let prediction;
  try {
    prediction = await callMLService(imageReference);
  } catch (err) {
    console.error(`[ML Pipeline] Inference failed for ${reportId}:`, err.message);
    if (mlJob) {
      mlJob.status = 'FAILED';
      mlJob.error = err.message;
      mlJob.completedAt = new Date();
      await mlJob.save();
    }
    throw err;
  }

  const diseaseName = prediction.predictedDisease || prediction.disease || 'Unknown';
  const confidence = prediction.confidence || 0;
  const isMock = prediction.isMock || false;

  // Lookup treatment from Knowledge Base
  const treatmentInfo = getTreatmentByDisease(diseaseName);

  // Update Report in MongoDB
  const updatedReport = await Report.findOneAndUpdate(
    { reportId },
    {
      disease: diseaseName,
      confidence: confidence,
      isMock: isMock,
      treatment: treatmentInfo?.treatment || 'Consult your local agricultural officer for specific treatment advice.',
      medicine: treatmentInfo?.medicine || 'Visit your local agricultural center for approved fungicides.',
      prevention: treatmentInfo?.prevention || 'Maintain good crop hygiene, adequate spacing, and avoid overhead irrigation.',
      status: 'ANALYZED'
    },
    { returnDocument: 'after' }
  );

  // Update MLJob record
  if (mlJob) {
    mlJob.status = 'COMPLETED';
    mlJob.prediction = diseaseName;
    mlJob.confidence = confidence;
    mlJob.completedAt = new Date();
    await mlJob.save();
  }

  // Real-time notification broadcasts
  if (io) {
    // Broadcast to officer dashboard
    io.emit('report:analyzed', {
      reportId,
      disease: diseaseName,
      confidence,
      location: { lat: updatedReport?.latitude, lng: updatedReport?.longitude }
    });

    // Notify specific farmer
    if (updatedReport?.userId) {
      io.emit(`report:result:${updatedReport.userId.toString()}`, {
        reportId,
        disease: diseaseName,
        confidence,
        treatment: treatmentInfo?.treatment,
        medicine: treatmentInfo?.medicine,
        prevention: treatmentInfo?.prevention
      });
    }
  }

  console.log(`[ML Pipeline] ✅ Report ${reportId} analyzed: ${diseaseName} (${(confidence * 100).toFixed(1)}%)`);
  return { reportId, disease: diseaseName, confidence };
};

/**
 * BullMQ Worker Initialization
 */
export const startMLWorker = async (io) => {
  try {
    const { Worker } = await import('bullmq');
    const { default: IORedis } = await import('ioredis');

    const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 2) return null;
        return 500;
      }
    });

    connection.on('error', () => {});

    await connection.connect();

    worker = new Worker('ml-image-processing', async (job) => {
      const { reportId, imageReference } = job.data;
      return await processMLForReport(reportId, imageReference, io);
    }, {
      connection,
      concurrency: 2
    });

    worker.on('completed', (job, result) => {
      console.log(`[BullMQ Worker] Job ${job.id} completed:`, result?.disease);
    });

    worker.on('failed', (job, err) => {
      console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
    });

    isWorkerActive = true;
    console.log('✅ BullMQ ML Worker started — consuming from ml-image-processing queue');
  } catch (err) {
    console.warn('⚠️ BullMQ ML Worker offline (Redis not connected). Direct asynchronous processing enabled.');
    isWorkerActive = false;
  }
};

export { isWorkerActive };
