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
  syncStatus: { type: String, enum: ['SYNCED'], default: 'SYNCED' } // From server perspective, it's synced if it's here
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
