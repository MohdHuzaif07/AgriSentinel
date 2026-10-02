import dns from 'dns';
// Resolve querySrv ECONNREFUSED on Windows networks by using public reliable DNS
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import Report from './src/models/Report.js';
import Alert from './src/models/Alert.js';
import { TREATMENT_KB } from './src/data/treatments.js';

dotenv.config();

const seed = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agrisentinel';
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

  try {
    console.log(`📡 Connecting to MongoDB Atlas (${maskedUri})...`);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to MongoDB Atlas! Clearing existing demo collections...');

    await User.deleteMany({});
    await Report.deleteMany({});
    await Alert.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    console.log('🌱 Seeding demo accounts (Admin, Officer & Field Worker)...');
    
    const admin = await User.create({
      name: 'System Admin (Dr. Rajesh)',
      email: 'admin@example.com',
      passwordHash,
      role: 'ADMIN',
      preferredLanguage: 'en',
      region: 'National HQ'
    });

    const officer = await User.create({
      name: 'Dr. Anita Sharma (Officer)',
      email: 'officer@example.com',
      passwordHash,
      role: 'AGRICULTURAL_OFFICER',
      preferredLanguage: 'en',
      region: 'South Zone'
    });

    const farmer = await User.create({
      name: 'Ramesh Kumar (Farmer)',
      email: 'farmer@example.com',
      passwordHash,
      role: 'FIELD_WORKER',
      preferredLanguage: 'ta',
      region: 'Coimbatore District'
    });

    console.log('🗺️ Seeding 10 geospatial disease sample reports across India with ML & Treatment KB data...');
    const sampleDiseases = [
      { crop: 'Tomato', disease: 'Tomato_Late_blight', severity: 'HIGH', conf: 0.94 },
      { crop: 'Tomato', disease: 'Tomato_Early_blight', severity: 'MEDIUM', conf: 0.88 },
      { crop: 'Potato', disease: 'Potato_Late_blight', severity: 'HIGH', conf: 0.96 },
      { crop: 'Potato', disease: 'Potato_Early_blight', severity: 'LOW', conf: 0.82 },
      { crop: 'Pepper', disease: 'Pepper_bell_Bacterial_spot', severity: 'MEDIUM', conf: 0.91 },
      { crop: 'Tomato', disease: 'Tomato_healthy', severity: 'LOW', conf: 0.98 }
    ];

    const baseCoords = [
      { lat: 11.0168, lng: 76.9558 }, // Coimbatore
      { lat: 11.6643, lng: 78.1460 }, // Salem
      { lat: 10.7905, lng: 78.7047 }, // Trichy
      { lat: 9.9252, lng: 78.1198 },  // Madurai
      { lat: 12.9716, lng: 77.5946 }, // Bengaluru
      { lat: 13.0827, lng: 80.2707 }, // Chennai
      { lat: 17.3850, lng: 78.4867 }, // Hyderabad
      { lat: 15.3173, lng: 75.7139 }, // Hubli
      { lat: 18.5204, lng: 73.8567 }, // Pune
      { lat: 12.2958, lng: 76.6394 }  // Mysore
    ];

    const reports = [];
    for (let i = 0; i < 10; i++) {
      const sample = sampleDiseases[i % sampleDiseases.length];
      const coords = baseCoords[i % baseCoords.length];
      const kbData = TREATMENT_KB[sample.disease] || {};
      const status = i % 3 === 0 ? 'RESOLVED' : i % 2 === 0 ? 'ANALYZED' : 'PENDING';

      reports.push({
        reportId: `DEMO_REP_${1000 + i}`,
        userId: farmer._id,
        imageReference: 'dummy_url.jpg',
        cropType: sample.crop,
        latitude: coords.lat + (Math.random() - 0.5) * 0.1,
        longitude: coords.lng + (Math.random() - 0.5) * 0.1,
        description: `Field inspection notes for ${sample.crop}. Observed symptoms matching ${sample.disease}.`,
        severity: sample.severity,
        status,
        disease: status !== 'PENDING' ? sample.disease : undefined,
        confidence: status !== 'PENDING' ? sample.conf : undefined,
        treatment: status !== 'PENDING' ? kbData.treatment : undefined,
        medicine: status !== 'PENDING' ? kbData.medicine : undefined,
        prevention: status !== 'PENDING' ? kbData.prevention : undefined,
        officerId: status === 'RESOLVED' ? officer._id : undefined,
        officerRecommendation: status === 'RESOLVED' ? 'Field visited by Agricultural Officer. Confirmed diagnosis. Follow prescribed chemical schedule strictly.' : undefined,
        officerMedicine: status === 'RESOLVED' ? 'Copper Oxychloride 50 WP @ 3g/L water' : undefined,
        officerReviewedAt: status === 'RESOLVED' ? new Date() : undefined
      });
    }

    await Report.insertMany(reports);

    console.log('📢 Seeding demo regional outbreak alert from Agricultural Officer...');
    await Alert.create({
      officerId: officer._id,
      officerName: officer.name,
      title: '🚨 Tomato Late Blight Outbreak Warning',
      message: 'Active Late Blight hotspot detected in Coimbatore & Salem regions. High humidity forecast. Apply preventive copper spray within 48 hours.',
      diseaseType: 'Tomato Late Blight',
      severity: 'HIGH',
      centerLat: 11.0168,
      centerLng: 76.9558,
      radiusKm: 50,
      targetFarmerIds: [farmer._id]
    });

    console.log('\n=============================================');
    console.log('🎉 Database seeded successfully into MongoDB Atlas!');
    console.log('=============================================');
    console.log('Demo Credentials:');
    console.log('🌾 Field Worker / Farmer: farmer@example.com  / password123');
    console.log('🗺️ Agricultural Officer:  officer@example.com / password123');
    console.log('⚙️ System Administrator:  admin@example.com   / password123');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Failed to seed database (${maskedUri}): ${error.message}`);
    process.exit(1);
  }
};

seed();
