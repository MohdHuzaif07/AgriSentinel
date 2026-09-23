import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import Report from './src/models/Report.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agrisentinel');
    console.log('Connected to DB. Clearing collections...');
    
    await User.deleteMany();
    await Report.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    console.log('Seeding Users...');
    const officer = await User.create({
      name: 'Admin Officer',
      email: 'officer@example.com',
      passwordHash,
      role: 'AGRICULTURAL_OFFICER'
    });

    const farmer = await User.create({
      name: 'Demo Farmer',
      email: 'farmer@example.com',
      passwordHash,
      role: 'FIELD_WORKER'
    });

    console.log('Seeding Reports...');
    const reports = [];
    for(let i=0; i<10; i++) {
      reports.push({
        reportId: `DEMO_REP_${i}`,
        userId: farmer._id,
        imageReference: 'dummy_url.jpg',
        cropType: i % 2 === 0 ? 'Tomato' : 'Potato',
        latitude: 20 + Math.random() * 5,
        longitude: 78 + Math.random() * 5,
        severity: i % 3 === 0 ? 'HIGH' : 'LOW',
        status: i % 4 === 0 ? 'RESOLVED' : 'PENDING'
      });
    }

    await Report.insertMany(reports);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed:', error);
    process.exit(1);
  }
};

seed();
