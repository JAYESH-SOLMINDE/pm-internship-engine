// seedStep02.js
// Run from project root:  node seedStep02.js
require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Company = require('./backend/models/Company');
const Internship = require('./backend/models/Internship');

const companiesRaw = require('./seed-data/companies.json');
const internshipsRaw = require('./seed-data/internships.json');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pm_internship';

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear only companies + internships (leaves candidates alone)
    await Company.deleteMany({});
    await Internship.deleteMany({});
    console.log('🗑️  Cleared companies & internships');

    // Hash passwords and insert companies
    const companies = await Promise.all(
        companiesRaw.map(async (c) => ({
            companyName: c.companyName,
            email: c.email,
            password: await bcrypt.hash(c.password, 10),
            phone: c.phone,
            sector: c.sector,
            location: { state: c.state, city: c.city },
            verified: c.verified,
            website: c.website || '',
            description: c.description || '',
        }))
    );

    const inserted = await Company.insertMany(companies);
    console.log(`✅ Inserted ${inserted.length} companies`);

    // Build email → _id map
    const emailToId = {};
    inserted.forEach((c) => { emailToId[c.email] = c._id; });

    // Build and insert internships
    const internships = internshipsRaw.map((i) => ({
        companyId: emailToId[i.companyEmail],
        title: i.title,
        description: i.description,
        skillsRequired: i.skillsRequired,
        sector: i.sector,
        location: { state: i.state, city: i.city },
        stipend: i.stipend,
        duration: i.duration,
        totalSeats: i.totalSeats,
        filledSeats: i.filledSeats,
        status: i.status,
        quotaBreakdown: i.quotaBreakdown,
        applicationDeadline: i.applicationDeadline || undefined,
    }));

    const insertedI = await Internship.insertMany(internships);
    console.log(`✅ Inserted ${insertedI.length} internships`);

    await mongoose.disconnect();
    console.log('🎉 Step 02 seed complete!');
    console.log('\nCompany login credentials:');
    companiesRaw.forEach((c) => {
        console.log(`  ${c.companyName.padEnd(30)} ${c.email}  /  ${c.password}`);
    });
}

seed().catch((err) => {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
});