/**
 * Candidate Schema — PM Internship Scheme
 * models/Candidate.js
 *
 * Captures all candidate attributes required for:
 * - Profile management
 * - AI-based matching
 * - Affirmative action quota enforcement
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const educationSchema = new mongoose.Schema({
  degree: {
    type: String,
    enum: ['B.Tech', 'B.E.', 'B.Sc', 'B.Com', 'BBA', 'BA', 'M.Tech', 'MBA', 'M.Sc', 'MA', 'Diploma', 'Other'],
    required: true,
  },
  stream: {
    type: String,
    required: true,
    trim: true,
    // e.g., Computer Science, Mechanical Engineering, Commerce
  },
  college: {
    type: String,
    required: true,
    trim: true,
  },
  graduationYear: {
    type: Number,
    required: true,
    min: 2000,
    max: 2030,
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100,
  },
}, { _id: false });

const locationPreferenceSchema = new mongoose.Schema({
  state: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  willingToRelocate: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

// ─── Main Candidate Schema ────────────────────────────────────────────────────

const candidateSchema = new mongoose.Schema(
  {
    // ── Personal Info ──────────────────────────────────────────────
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password in queries
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
    },

    // ── Education & Academic Info ──────────────────────────────────
    education: {
      type: educationSchema,
      default: null,
    },

    // ── Skills ────────────────────────────────────────────────────
    skills: {
      type: [String],
      default: [],
      // Manually entered by candidate
    },
    parsedSkills: {
      type: [String],
      default: [],
      // Auto-extracted from uploaded resume via pdf-parse NLP
    },

    // ── Location Preference ────────────────────────────────────────
    locationPreference: {
      type: locationPreferenceSchema,
      default: {},
    },

    // ── Sector Interest ───────────────────────────────────────────
    sectorInterest: {
      type: [String],
      enum: [
        'Finance', 'Technology', 'Manufacturing', 'Healthcare',
        'Agriculture', 'Infrastructure', 'Education', 'Retail',
        'Logistics', 'Energy', 'Telecom', 'Media', 'Consulting', 'Other',
      ],
      default: [],
    },

    // ── Affirmative Action Fields ─────────────────────────────────
    socialCategory: {
      type: String,
      enum: ['General', 'OBC', 'SC', 'ST'],
      required: [true, 'Social category is required'],
      default: 'General',
    },
    districtType: {
      type: String,
      enum: ['Urban', 'Rural', 'Aspirational'],
      required: [true, 'District type is required'],
      default: 'Urban',
    },

    // ── Resume & Parsing ──────────────────────────────────────────
    resumeUrl: {
      type: String,
      default: null,
    },
    resumeOriginalName: {
      type: String,
      default: null,
    },
    resumeUploadedAt: {
      type: Date,
      default: null,
    },

    // ── Participation & Status ────────────────────────────────────
    pastParticipation: {
      type: Boolean,
      default: false,
      // true = has participated in PM Internship before
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },

    // ── Matching Metadata (used by AI engine) ─────────────────────
    matchScore: {
      type: Number,
      default: null,
    },
    allocatedInternship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Profile Completion Percentage ───────────────────────────────────
candidateSchema.virtual('completionPercentage').get(function () {
  let score = 0;
  const fields = [
    this.fullName,
    this.email,
    this.phone,
    this.education?.degree,
    this.education?.college,
    this.socialCategory,
    this.districtType,
    this.skills?.length > 0,
    this.sectorInterest?.length > 0,
    this.resumeUrl,
  ];
  fields.forEach(f => { if (f) score += 10; });
  return Math.min(score, 100);
});

// ─── Middleware: Hash password before saving ──────────────────────────────────
candidateSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Method: Compare passwords ────────────────────────────────────────────────
candidateSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Indexes ──────────────────────────────────────────────────────────────────
candidateSchema.index({ email: 1 });
candidateSchema.index({ socialCategory: 1, districtType: 1 });
candidateSchema.index({ sectorInterest: 1 });

module.exports = mongoose.model('Candidate', candidateSchema);
