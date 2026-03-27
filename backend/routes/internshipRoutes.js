// backend/routes/internshipRoutes.js
const express    = require('express');
const router     = express.Router();
const Internship = require('../models/Internship');
const { protect } = require('../middleware/authMiddleware'); // reuse from Step 01

// ──────────────────────────────────────────────────────
// POST /api/internships/create   (company only)
// ──────────────────────────────────────────────────────
router.post('/create', protect, async (req, res) => {
  // Only tokens with role === 'company' may create listings
  if (req.user.role !== 'company')
    return res.status(403).json({ message: 'Only companies can post internships' });

  const {
    title, description, skillsRequired, sector, state, city,
    stipend, duration, totalSeats, quotaBreakdown, applicationDeadline,
  } = req.body;

  try {
    const internship = await Internship.create({
      companyId: req.user.id,
      title, description,
      skillsRequired: skillsRequired || [],
      sector,
      location: { state, city },
      stipend, duration, totalSeats,
      quotaBreakdown: quotaBreakdown || {},
      applicationDeadline: applicationDeadline || undefined,
    });

    const populated = await internship.populate('companyId', 'companyName sector location');
    res.status(201).json({ message: 'Internship created', internship: populated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ──────────────────────────────────────────────────────
// GET /api/internships/all   (public)
// Query params: sector, state, city, skill, minStipend, maxStipend, status
// ──────────────────────────────────────────────────────
router.get('/all', async (req, res) => {
  const { sector, state, city, skill, minStipend, maxStipend, status } = req.query;

  try {
    const filter = {};

    if (sector) filter.sector           = sector;
    if (state)  filter['location.state'] = new RegExp(state, 'i');
    if (city)   filter['location.city']  = new RegExp(city, 'i');
    if (skill)  filter.skillsRequired    = { $in: [new RegExp(skill, 'i')] };

    // Default: only show Open listings unless caller specifies otherwise
    filter.status = status || 'Open';

    if (minStipend || maxStipend) {
      filter.stipend = {};
      if (minStipend) filter.stipend.$gte = Number(minStipend);
      if (maxStipend) filter.stipend.$lte = Number(maxStipend);
    }

    const internships = await Internship.find(filter)
      .populate('companyId', 'companyName sector location verified')
      .sort({ createdAt: -1 });

    res.json({ count: internships.length, internships });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ──────────────────────────────────────────────────────
// GET /api/internships/company/:companyId   (public)
// All listings posted by one company
// ──────────────────────────────────────────────────────
router.get('/company/:companyId', async (req, res) => {
  try {
    const internships = await Internship.find({ companyId: req.params.companyId })
      .sort({ createdAt: -1 });
    res.json({ count: internships.length, internships });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────
// GET /api/internships/:id   (public)
// Single internship detail
// ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('companyId', 'companyName sector location website description verified');
    if (!internship) return res.status(404).json({ message: 'Not found' });
    res.json(internship);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────
// PUT /api/internships/:id   (company owner only)
// Update internship details
// ──────────────────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found' });

    if (internship.companyId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorised' });

    const allowed = [
      'title', 'description', 'skillsRequired', 'sector',
      'location', 'stipend', 'duration', 'totalSeats',
      'quotaBreakdown', 'applicationDeadline',
    ];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const updated = await Internship.findByIdAndUpdate(
      req.params.id, { $set: updates }, { new: true, runValidators: true }
    ).populate('companyId', 'companyName sector location');

    res.json({ message: 'Updated', internship: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ──────────────────────────────────────────────────────
// PUT /api/internships/:id/status   (company owner or admin)
// Change status: Open | Filled | Closed
// ──────────────────────────────────────────────────────
router.put('/:id/status', protect, async (req, res) => {
  const { status } = req.body;
  if (!['Open', 'Filled', 'Closed'].includes(status))
    return res.status(400).json({ message: 'Invalid status' });

  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found' });

    const isOwner = internship.companyId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: 'Not authorised' });

    internship.status = status;
    await internship.save();
    res.json({ message: `Status changed to ${status}`, internship });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;