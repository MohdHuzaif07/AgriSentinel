import mongoose from 'mongoose';

const treatmentSchema = new mongoose.Schema({
  diseaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Disease', required: true },
  crop: { type: String },
  language: { type: String, enum: ['en', 'ta', 'hi'], default: 'en' },
  treatmentText: { type: String, required: true },
  precautions: [{ type: String }],
  region: { type: String }
}, { timestamps: true });

export default mongoose.model('Treatment', treatmentSchema);
