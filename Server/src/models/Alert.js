import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  officerName: { type: String },
  title: { type: String, default: 'Crop Disease Alert' },
  message: { type: String, required: true },
  diseaseType: { type: String },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'HIGH' },

  // Geographic targeting
  centerLat: { type: Number, required: true },
  centerLng: { type: Number, required: true },
  radiusKm: { type: Number, default: 10 },

  // Target farmers (populated at creation time)
  targetFarmerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  affectedReportIds: [{ type: String }],

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Alert', alertSchema);
