/**
 * Database Seeder — PM Internship Scheme
 * backend/seed.js
 *
 * Populates MongoDB with 10 sample candidates.
 * Run: node seed.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Candidate = require('./models/Candidate');
const candidatesData = require('../seed-data/candidates.json');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  Connected to MongoDB for seeding...');

    // Clear existing candidates
    await Candidate.deleteMany({});
    console.log('🗑️   Cleared existing candidates');

    // Hash passwords before insert (pre-save hook would run but
    // insertMany bypasses it, so we hash manually)
    const hashed = await Promise.all(
      candidatesData.map(async (c) => {
        const salt = await bcrypt.genSalt(12);
        return { ...c, password: await bcrypt.hash(c.password, salt) };
      })
    );

    const inserted = await Candidate.insertMany(hashed);
    console.log(`🌱  Seeded ${inserted.length} candidates successfully!`);

    inserted.forEach(c => {
      console.log(`   → ${c.fullName} (${c.email}) | ${c.socialCategory} | ${c.districtType}`);
    });

    await mongoose.disconnect();
    console.log('\n✅  Seeding complete. Database disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('❌  Seeding failed:', err);
    process.exit(1);
  }
};

seed();
