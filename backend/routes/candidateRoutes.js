/**
 * Candidate Routes — PM Internship Scheme
 * routes/candidateRoutes.js
 *
 * Prefix: /api/candidates
 *
 * Routes:
 *   POST   /register           → Register new candidate
 *   POST   /login              → JWT login
 *   GET    /profile/:id        → Get candidate profile
 *   PUT    /profile/:id        → Update candidate profile
 *   POST   /upload-resume/:id  → Upload PDF + parse skills
 */

const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const { protect, generateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { parseResume } = require('../utils/resumeParser');
const path = require('path');
const fs = require('fs');

// ─── POST /register ───────────────────────────────────────────────────────────
/**
 * Register a new candidate.
 * Body: { fullName, email, password, phone, socialCategory, districtType }
 */
router.post('/register', async (req, res) => {
  try {
    const {
      fullName, email, password, phone,
      socialCategory, districtType,
    } = req.body;

    // Check if email already exists
    const existing = await Candidate.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create candidate
    const candidate = await Candidate.create({
      fullName,
      email,
      password,
      phone,
      socialCategory: socialCategory || 'General',
      districtType: districtType || 'Urban',
    });

    const token = generateToken(candidate._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to PM Internship Scheme.',
      token,
      candidate: {
        id: candidate._id,
        fullName: candidate.fullName,
        email: candidate.email,
        socialCategory: candidate.socialCategory,
        districtType: candidate.districtType,
        completionPercentage: candidate.completionPercentage,
      },
    });
  } catch (err) {
    // Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// ─── POST /login ──────────────────────────────────────────────────────────────
/**
 * Authenticate candidate and return JWT.
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Explicitly select password field (it's hidden by default)
    const candidate = await Candidate.findOne({ email }).select('+password');
    if (!candidate) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await candidate.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(candidate._id);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      candidate: {
        id: candidate._id,
        fullName: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone,
        socialCategory: candidate.socialCategory,
        districtType: candidate.districtType,
        resumeUrl: candidate.resumeUrl,
        completionPercentage: candidate.completionPercentage,
        profileCompleted: candidate.profileCompleted,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// ─── GET /profile/:id ─────────────────────────────────────────────────────────
/**
 * Get full candidate profile by ID.
 * Protected route — requires JWT.
 */
router.get('/profile/:id', protect, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    res.json({
      success: true,
      candidate,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
});

// ─── PUT /profile/:id ─────────────────────────────────────────────────────────
/**
 * Update candidate profile (education, skills, sector, location).
 * Protected route.
 * Body: Partial candidate fields
 */
router.put('/profile/:id', protect, async (req, res) => {
  try {
    // Prevent password or email change via this route
    const { password, email, ...updateData } = req.body;

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    // Check if profile is sufficiently complete
    if (candidate.completionPercentage >= 60) {
      await Candidate.findByIdAndUpdate(req.params.id, { profileCompleted: true });
      candidate.profileCompleted = true;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      candidate,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
});

// ─── POST /upload-resume/:id ──────────────────────────────────────────────────
/**
 * Upload PDF resume for a candidate.
 * Auto-parses skills using pdf-parse + NLP.
 * Protected route.
 * Form-data: { resume: File }
 */
router.post('/upload-resume/:id', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a PDF resume.',
      });
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      // Remove uploaded file if candidate not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    // Remove old resume if exists
    if (candidate.resumeUrl) {
      const oldPath = path.join(__dirname, '..', candidate.resumeUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // ── Parse Resume for Skills ────────────────────────────────────
    const parseResult = await parseResume(req.file.path);

    // ── Relative URL for public access ────────────────────────────
    const relativeUrl = `/uploads/resumes/${req.file.filename}`;

    // ── Update Candidate Record ────────────────────────────────────
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      {
        resumeUrl: relativeUrl,
        resumeOriginalName: req.file.originalname,
        resumeUploadedAt: new Date(),
        parsedSkills: parseResult.success ? parseResult.detectedSkills : [],
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Resume uploaded and parsed successfully.',
      resumeUrl: relativeUrl,
      parsedSkills: parseResult.success ? parseResult.detectedSkills : [],
      parseStats: {
        wordCount: parseResult.wordCount,
        pageCount: parseResult.pageCount,
        skillsFound: parseResult.detectedSkills?.length || 0,
      },
      candidate: updatedCandidate,
    });
  } catch (err) {
    // Handle multer errors (file size, type)
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 2MB.',
      });
    }
    if (err.message?.includes('Only PDF')) {
      return res.status(400).json({
        success: false,
        message: 'Only PDF files are accepted for resume upload.',
      });
    }
    console.error('Resume upload error:', err);
    res.status(500).json({ success: false, message: 'Server error during resume upload.' });
  }
});

module.exports = router;
