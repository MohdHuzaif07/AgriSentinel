import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reportId: { type: String, required: true, unique: true }, // Client generated for offline sync
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageReference: { type: String, required: true },
  cropType: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  locationMetadata: { type: Object },
  description: { type: String },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
  status: { type: String, enum: ['PENDING', 'ANALYZED', 'RESOLVED'], default: 'PENDING' },
  syncStatus: { type: String, enum: ['SYNCED'], default: 'SYNCED' }, // From server perspective, it's synced if it's here

  // ML Prediction Results
  disease: { type: String },
  confidence: { type: Number },
  isMock: { type: Boolean, default: false },

  // Treatment Knowledge Base Output
  treatment: { type: String },
  medicine: { type: String },
  prevention: { type: String },

  // Officer Intervention
  officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  officerRecommendation: { type: String },
  officerMedicine: { type: String },
  officerNotes: { type: String },
  officerReviewedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
