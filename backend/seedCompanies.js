require('dotenv').config();
const mongoose = require('mongoose');
const Company    = require('./models/Company');
const Internship = require('./models/Internship');

const companies = [
  { companyName: 'FinServe Capital Pvt Ltd',  email: 'hr@finservecapital.in',  password: 'password123', phone: '9876543210', sector: 'Finance',        location: { state: 'Maharashtra', city: 'Mumbai'    } },
  { companyName: 'TechNova Solutions',         email: 'careers@technova.io',    password: 'password123', phone: '9876543211', sector: 'Technology',     location: { state: 'Karnataka',   city: 'Bengaluru' } },
  { companyName: 'GreenAgro Industries',       email: 'jobs@greenagro.co.in',   password: 'password123', phone: '9876543212', sector: 'Agriculture',    location: { state: 'Maharashtra', city: 'Pune'      } },
  { companyName: 'Medlife Healthcare',         email: 'intern@medlifehc.com',   password: 'password123', phone: '9876543213', sector: 'Healthcare',     location: { state: 'Telangana',   city: 'Hyderabad' } },
  { companyName: 'BuildBridge Infrastructure', email: 'hr@buildbridge.in',      password: 'password123', phone: '9876543214', sector: 'Infrastructure', location: { state: 'Delhi',       city: 'Delhi'     } },
];

const internshipTemplates = [
  { title: 'Financial Analyst Intern',    description: 'Work with our finance team on analysis and reporting.',         sector: 'Finance',        stipend: 10000, duration: '3 months', totalSeats: 5 },
  { title: 'Risk & Compliance Intern',    description: 'Assist in risk assessment and regulatory compliance tasks.',    sector: 'Finance',        stipend: 9000,  duration: '2 months', totalSeats: 3 },
  { title: 'Frontend Developer Intern',   description: 'Build and maintain user interfaces using React.',               sector: 'Technology',     stipend: 12000, duration: '3 months', totalSeats: 8 },
  { title: 'Backend Developer Intern',    description: 'Develop APIs and backend services using Node.js.',              sector: 'Technology',     stipend: 12000, duration: '3 months', totalSeats: 6 },
  { title: 'Data Science Intern',         description: 'Analyze datasets and build predictive models.',                 sector: 'Technology',     stipend: 15000, duration: '6 months', totalSeats: 4 },
  { title: 'Agri-Tech Research Intern',   description: 'Research and implement agri-tech solutions for farmers.',      sector: 'Agriculture',    stipend: 8000,  duration: '3 months', totalSeats: 5 },
  { title: 'Supply Chain Intern',         description: 'Support supply chain operations and logistics planning.',       sector: 'Agriculture',    stipend: 7500,  duration: '2 months', totalSeats: 4 },
  { title: 'Farm Operations Intern',      description: 'Assist in day-to-day farm operations and management.',         sector: 'Agriculture',    stipend: 7000,  duration: '3 months', totalSeats: 6 },
  { title: 'Clinical Research Intern',    description: 'Support clinical trials and medical research activities.',      sector: 'Healthcare',     stipend: 10000, duration: '6 months', totalSeats: 3 },
  { title: 'Hospital Admin Intern',       description: 'Assist in hospital administration and patient coordination.',   sector: 'Healthcare',     stipend: 8000,  duration: '3 months', totalSeats: 5 },
  { title: 'Pharmacy Intern',             description: 'Work with pharmacists on dispensing and drug management.',      sector: 'Healthcare',     stipend: 9000,  duration: '3 months', totalSeats: 4 },
  { title: 'Civil Engineering Intern',    description: 'Assist in civil engineering projects and site supervision.',    sector: 'Infrastructure', stipend: 11000, duration: '6 months', totalSeats: 7 },
  { title: 'Project Management Intern',   description: 'Support project planning, tracking and delivery.',              sector: 'Infrastructure', stipend: 10000, duration: '3 months', totalSeats: 5 },
  { title: 'Quantity Surveying Intern',   description: 'Assist in cost estimation and quantity surveying tasks.',       sector: 'Infrastructure', stipend: 9500,  duration: '3 months', totalSeats: 4 },
  { title: 'Site Supervision Intern',     description: 'Supervise construction site activities and safety compliance.', sector: 'Infrastructure', stipend: 8500,  duration: '2 months', totalSeats: 6 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await Company.deleteMany({});
    await Internship.deleteMany({});
    console.log('🗑️  Cleared companies & internships');

    // Use create() so pre-save password hashing runs
    const insertedCompanies = [];
    for (const c of companies) {
      const company = await Company.create(c);
      insertedCompanies.push(company);
    }
    console.log(`✅ Inserted ${insertedCompanies.length} companies`);

    const internshipDocs = internshipTemplates.map((t, i) => {
      const company = insertedCompanies[i % insertedCompanies.length];
      return {
        ...t,
        companyId:           company._id,
        location:            company.location,
        status:              'Open',
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
    });
    const insertedInternships = await Internship.insertMany(internshipDocs);
    console.log(`✅ Inserted ${insertedInternships.length} internships`);

    console.log('\n🎉 Step 02 seed complete!\n');
    console.log('Company login credentials:');
    companies.forEach((c) => {
      console.log(`  ${c.companyName.padEnd(35)} ${c.email.padEnd(30)}  /  password123`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
