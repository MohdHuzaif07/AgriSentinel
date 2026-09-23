import mongoose from 'mongoose';

const mlJobSchema = new mongoose.Schema({
  reportId: { type: String, required: true },
  status: { type: String, enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'QUEUED' },
  prediction: { type: String },
  confidence: { type: Number },
  startedAt: { type: Date },
  completedAt: { type: Date },
  error: { type: String }
}, { timestamps: true });

export default mongoose.model('MLJob', mlJobSchema);
