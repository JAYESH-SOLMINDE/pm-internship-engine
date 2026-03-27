// backend/routes/companyRoutes.js
const express  = require('express');
const router   = express.Router();
const Company  = require('../models/Company');
const jwt      = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware'); // reuse from Step 01

// ── Helper: generate JWT ───────────────────────────────
const generateToken = (id, role) =>
  jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'pm_internship_secret_key',
    { expiresIn: '7d' }
  );

// ──────────────────────────────────────────────────────
// POST /api/companies/register
// ──────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { companyName, email, password, phone, sector, state, city, website, description } =
    req.body;

  try {
    const exists = await Company.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const company = await Company.create({
      companyName, email, password, phone, sector,
      location: { state, city },
      website:  website  || '',
      description: description || '',
    });

    res.status(201).json({
      message: 'Registered successfully. Pending admin verification.',
      company: {
        _id: company._id, companyName: company.companyName,
        email: company.email, sector: company.sector,
        location: company.location, verified: company.verified,
      },
      token: generateToken(company._id, 'company'),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ──────────────────────────────────────────────────────
// POST /api/companies/login
// ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const company = await Company.findOne({ email });
    if (!company || !(await company.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      message: 'Login successful',
      company: {
        _id: company._id, companyName: company.companyName,
        email: company.email, sector: company.sector,
        location: company.location, verified: company.verified,
      },
      token: generateToken(company._id, 'company'),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ──────────────────────────────────────────────────────
// GET /api/companies/profile/:id   (protected)
// ──────────────────────────────────────────────────────
router.get('/profile/:id', protect, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).select('-password');
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────
// PUT /api/companies/profile/:id   (protected)
// ──────────────────────────────────────────────────────
router.put('/profile/:id', protect, async (req, res) => {
  // Only the company itself (or an admin) may update
  if (req.user.id !== req.params.id && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Not authorised' });

  try {
    const allowed = ['companyName', 'phone', 'sector', 'location', 'website', 'description'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const updated = await Company.findByIdAndUpdate(
      req.params.id, { $set: updates }, { new: true, runValidators: true }
    ).select('-password');

    if (!updated) return res.status(404).json({ message: 'Company not found' });
    res.json({ message: 'Profile updated', company: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;