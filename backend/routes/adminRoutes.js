/**
 * backend/routes/adminRoutes.js
 * Admin authentication + dashboard data routes
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Candidate = require('../models/Candidate');
const Internship = require('../models/Internship');
const Company = require('../models/Company');
const Allocation = require('../models/Allocation');
const QuotaAllocation = require('../models/QuotaAllocation');

// ─── Hardcoded Admin Credentials (prototype) ──────────────────────────────────
const ADMIN_CREDENTIALS = {
    email: 'admin@pmscheme.gov.in',
    password: 'Admin@2024',
    name: 'Scheme Administrator',
};

// ─── Admin Auth Middleware ────────────────────────────────────────────────────
const adminProtect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admin access only' });
        req.admin = decoded;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// ─── POST /api/admin/login ────────────────────────────────────────────────────
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (email !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) {
        return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    const token = jwt.sign(
        { email, role: 'admin', name: ADMIN_CREDENTIALS.name },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
    res.json({ success: true, token, admin: { email, name: ADMIN_CREDENTIALS.name } });
});

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', adminProtect, async (req, res) => {
    try {
        const [
            totalCandidates,
            totalInternships,
            totalCompanies,
            totalAllocated,
            totalWaitlisted,
            totalAccepted,
            totalRejected,
        ] = await Promise.all([
            Candidate.countDocuments(),
            Internship.countDocuments({ status: 'Open' }),
            Company.countDocuments(),
            Allocation.countDocuments({ status: 'Pending' }),
            Allocation.countDocuments({ status: 'Waitlisted' }),
            Allocation.countDocuments({ status: 'Accepted' }),
            Allocation.countDocuments({ status: 'Rejected' }),
        ]);

        const totalResponded = totalAccepted + totalRejected;
        const acceptanceRate = totalResponded > 0
            ? Math.round((totalAccepted / totalResponded) * 100)
            : 0;

        const unmatched = totalCandidates - totalAllocated - totalWaitlisted - totalAccepted - totalRejected;

        res.json({
            totalCandidates,
            totalInternships,
            totalCompanies,
            totalAllocated,
            totalWaitlisted,
            totalAccepted,
            totalRejected,
            unmatched: Math.max(0, unmatched),
            acceptanceRate,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/admin/allocations ───────────────────────────────────────────────
router.get('/allocations', adminProtect, async (req, res) => {
    try {
        const { status, category, sector, state, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (category) filter.quotaCategory = category;

        const allocations = await Allocation.find(filter)
            .populate('candidateId', 'fullName email socialCategory districtType education')
            .populate('internshipId', 'title sector location stipend companyId')
            .sort({ matchScore: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();

        const total = await Allocation.countDocuments(filter);

        // Filter by sector/state after populate
        let filtered = allocations;
        if (sector) filtered = filtered.filter(a => a.internshipId?.sector === sector);
        if (state) filtered = filtered.filter(a => a.internshipId?.location?.state === state);

        res.json({ allocations: filtered, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── PUT /api/admin/allocations/:id/override ─────────────────────────────────
router.put('/allocations/:id/override', adminProtect, async (req, res) => {
    const { newInternshipId, reason } = req.body;
    try {
        const allocation = await Allocation.findById(req.params.id);
        if (!allocation) return res.status(404).json({ message: 'Allocation not found' });

        const newInternship = await Internship.findById(newInternshipId);
        if (!newInternship) return res.status(404).json({ message: 'Internship not found' });

        allocation.internshipId = newInternshipId;
        allocation.allocationReason = `Admin override: ${reason}`;
        allocation.status = 'Pending';
        allocation.respondedAt = null;
        await allocation.save();

        res.json({ success: true, allocation });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/admin/quota-summary ─────────────────────────────────────────────
router.get('/quota-summary', adminProtect, async (req, res) => {
    try {
        const categories = ['general', 'obc', 'sc', 'st', 'rural', 'aspirational'];
        const summary = {};

        for (const cat of categories) {
            const records = await QuotaAllocation.find({ category: cat });
            const total = records.reduce((s, r) => s + r.capacity, 0);
            const filled = records.reduce((s, r) => s + r.allocated, 0);
            summary[cat] = {
                capacity: total,
                allocated: filled,
                available: total - filled,
                pct: total > 0 ? Math.round((filled / total) * 100) : 0,
            };
        }

        res.json({ quotaSummary: summary });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/admin/category-report ──────────────────────────────────────────
router.get('/category-report', adminProtect, async (req, res) => {
    try {
        // Allocations by social category
        const byCategory = await Allocation.aggregate([
            { $lookup: { from: 'candidates', localField: 'candidateId', foreignField: '_id', as: 'candidate' } },
            { $unwind: '$candidate' },
            { $group: { _id: '$candidate.socialCategory', count: { $sum: 1 } } },
        ]);

        // Allocations by sector
        const bySector = await Allocation.aggregate([
            { $lookup: { from: 'internships', localField: 'internshipId', foreignField: '_id', as: 'internship' } },
            { $unwind: '$internship' },
            { $group: { _id: '$internship.sector', count: { $sum: 1 } } },
        ]);

        // Allocations by date (last 14 days)
        const byDate = await Allocation.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$allocatedAt' } },
                    count: { $sum: 1 },
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 14 },
        ]);

        // Allocations by state
        const byState = await Allocation.aggregate([
            { $lookup: { from: 'internships', localField: 'internshipId', foreignField: '_id', as: 'internship' } },
            { $unwind: '$internship' },
            { $group: { _id: '$internship.location.state', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        res.json({ byCategory, bySector, byDate, byState });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/admin/internship-capacity ───────────────────────────────────────
router.get('/internship-capacity', adminProtect, async (req, res) => {
    try {
        const internships = await Internship.find()
            .populate('companyId', 'companyName')
            .lean();
        res.json({ internships });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── PUT /api/admin/internships/:id/force-close ───────────────────────────────
router.put('/internships/:id/force-close', adminProtect, async (req, res) => {
    try {
        const internship = await Internship.findByIdAndUpdate(
            req.params.id,
            { status: 'Closed' },
            { new: true }
        );
        res.json({ success: true, internship });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/admin/export-csv ────────────────────────────────────────────────
router.get('/export-csv', adminProtect, async (req, res) => {
    try {
        const allocations = await Allocation.find()
            .populate('candidateId', 'fullName email socialCategory districtType education')
            .populate('internshipId', 'title sector location stipend')
            .lean();

        const rows = [
            ['Candidate Name', 'Email', 'Category', 'District', 'Internship', 'Sector', 'State', 'City', 'Stipend', 'Score', 'Status', 'Allocated At'],
            ...allocations.map(a => [
                a.candidateId?.fullName || '',
                a.candidateId?.email || '',
                a.candidateId?.socialCategory || '',
                a.candidateId?.districtType || '',
                a.internshipId?.title || '',
                a.internshipId?.sector || '',
                a.internshipId?.location?.state || '',
                a.internshipId?.location?.city || '',
                a.internshipId?.stipend || '',
                a.matchScore || '',
                a.status || '',
                a.allocatedAt ? new Date(a.allocatedAt).toLocaleDateString('en-IN') : '',
            ]),
        ];

        const csv = rows.map(r => r.join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=allocations.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = { router, adminProtect };