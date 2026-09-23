import mongoose from 'mongoose';

const diseaseSchema = new mongoose.Schema({
  diseaseName: { type: String, required: true },
  crop: { type: String, required: true },
  description: { type: String },
  symptoms: [{ type: String }],
  severityGuidance: { type: String },
  languageMappings: {
    en: { diseaseName: String, description: String },
    ta: { diseaseName: String, description: String },
    hi: { diseaseName: String, description: String }
  }
}, { timestamps: true });

export default mongoose.model('Disease', diseaseSchema);
