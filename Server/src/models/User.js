import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['FIELD_WORKER', 'AGRICULTURAL_OFFICER', 'ADMIN'], 
    default: 'FIELD_WORKER' 
  },
  preferredLanguage: { type: String, default: 'en' },
  region: { type: String },
  latitude: { type: Number },
  longitude: { type: Number }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
