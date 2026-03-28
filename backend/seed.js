require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const companies = [
  { name: 'FinServe Capital Pvt Ltd',    email: 'hr@finservecapital.in',  password: 'password123', industry: 'Finance',        city: 'Mumbai',    state: 'Maharashtra' },
  { name: 'TechNova Solutions',           email: 'careers@technova.io',    password: 'password123', industry: 'Technology',     city: 'Bengaluru', state: 'Karnataka'   },
  { name: 'GreenAgro Industries',         email: 'jobs@greenagro.co.in',   password: 'password123', industry: 'Agriculture',    city: 'Pune',      state: 'Maharashtra' },
  { name: 'Medlife Healthcare',           email: 'intern@medlifehc.com',   password: 'password123', industry: 'Healthcare',     city: 'Hyderabad', state: 'Telangana'   },
  { name: 'BuildBridge Infrastructure',   email: 'hr@buildbridge.in',      password: 'password123', industry: 'Infrastructure', city: 'Delhi',     state: 'Delhi'       },
];

const internshipTemplates = [
  { title: 'Financial Analyst Intern',    stipend: 10000, duration: 3, seats: 5, category: 'Finance'        },
  { title: 'Risk & Compliance Intern',    stipend: 9000,  duration: 2, seats: 3, category: 'Finance'        },
  { title: 'Frontend Developer Intern',   stipend: 12000, duration: 3, seats: 8, category: 'Technology'     },
  { title: 'Backend Developer Intern',    stipend: 12000, duration: 3, seats: 6, category: 'Technology'     },
  { title: 'Data Science Intern',         stipend: 15000, duration: 6, seats: 4, category: 'Technology'     },
  { title: 'Agri-Tech Research Intern',   stipend: 8000,  duration: 3, seats: 5, category: 'Agriculture'    },
  { title: 'Supply Chain Intern',         stipend: 7500,  duration: 2, seats: 4, category: 'Agriculture'    },
  { title: 'Farm Operations Intern',      stipend: 7000,  duration: 3, seats: 6, category: 'Agriculture'    },
  { title: 'Clinical Research Intern',    stipend: 10000, duration: 6, seats: 3, category: 'Healthcare'     },
  { title: 'Hospital Admin Intern',       stipend: 8000,  duration: 3, seats: 5, category: 'Healthcare'     },
  { title: 'Pharmacy Intern',             stipend: 9000,  duration: 3, seats: 4, category: 'Healthcare'     },
  { title: 'Civil Engineering Intern',    stipend: 11000, duration: 6, seats: 7, category: 'Infrastructure' },
  { title: 'Project Management Intern',   stipend: 10000, duration: 3, seats: 5, category: 'Infrastructure' },
  { title: 'Quantity Surveying Intern',   stipend: 9500,  duration: 3, seats: 4, category: 'Infrastructure' },
  { title: 'Site Supervision Intern',     stipend: 8500,  duration: 2, seats: 6, category: 'Infrastructure' },
];

const CompanySchema = new mongoose.Schema({
  name:     String,
  email:    { type: String, unique: true },
  password: String,
  industry: String,
  city:     String,
  state:    String,
}, { timestamps: true });

const InternshipSchema = new mongoose.Schema({
  title:               String,
  company:             mongoose.Schema.Types.ObjectId,
  companyName:         String,
  location:            String,
  stipend:             Number,
  duration:            Number,
  seats:               Number,
  category:            String,
  isActive:            Boolean,
  applicationDeadline: Date,
}, { timestamps: true });

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const Company    = mongoose.model('Company',    CompanySchema);
    const Internship = mongoose.model('Internship', InternshipSchema);

    await Company.deleteMany({});
    await Internship.deleteMany({});
    console.log('🗑️  Cleared companies & internships');

    const companyDocs = await Promise.all(
      companies.map(async (c) => {
        const hashed = await bcrypt.hash(c.password, 10);
        return { ...c, password: hashed };
      })
    );
    const insertedCompanies = await Company.insertMany(companyDocs);
    console.log(`✅ Inserted ${insertedCompanies.length} companies`);

    const internshipDocs = internshipTemplates.map((t, i) => {
      const company = insertedCompanies[i % insertedCompanies.length];
      return {
        ...t,
        company:             company._id,
        companyName:         company.name,
        location:            `${company.city}, ${company.state}`,
        isActive:            true,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
    });
    const insertedInternships = await Internship.insertMany(internshipDocs);
    console.log(`✅ Inserted ${insertedInternships.length} internships`);

    console.log('\n🎉 Step 02 seed complete!\n');
    console.log('Company login credentials:');
    companies.forEach((c) => {
      console.log(`  ${c.name.padEnd(35)} ${c.email.padEnd(30)}  /  password123`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();