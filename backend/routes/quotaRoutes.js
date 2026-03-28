/**
 * backend/routes/quotaRoutes.js
 * Quota management API routes
 */

const express = require('express');
const router = express.Router();
const QuotaAllocation = require('../models/QuotaAllocation');
const Internship = require('../models/Internship');
const { QUOTA_RULES } = require('../middleware/quotaMiddleware');

// ─── Helper: compute quota capacities from totalSeats ─────────────────────────
function computeQuotaCapacities(totalSeats) {
    return {
        sc: Math.ceil(totalSeats * 0.15),
        st: Math.ceil(totalSeats * 0.075),
        obc: Math.ceil(totalSeats * 0.27),
        rural: Math.ceil(totalSeats * 0.10),
        aspirational: Math.ceil(totalSeats * 0.05),
        general: Math.floor(totalSeats * 0.50),
    };
}

// ─── GET /api/quota/status/:internshipId ──────────────────────────────────────
router.get('/status/:internshipId', async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.internshipId);
        if (!internship) return res.status(404).json({ message: 'Internship not found' });

        // Get or create quota records
        const categories = ['general', 'obc', 'sc', 'st', 'rural', 'aspirational'];
        const capacities = computeQuotaCapacities(internship.totalSeats);

        const status = {};
        for (const cat of categories) {
            let quota = await QuotaAllocation.findOne({
                internshipId: internship._id,
                category: cat,
            });

            if (!quota) {
                quota = await QuotaAllocation.create({
                    internshipId: internship._id,
                    category: cat,
                    capacity: capacities[cat],
                    allocated: 0,
                });
            }

            const minRequired = Math.ceil(internship.totalSeats * (QUOTA_RULES[cat]?.minPct || 0));
            status[cat] = {
                capacity: quota.capacity,
                allocated: quota.allocated,
                available: quota.available,
                minRequired,
                atRisk: quota.allocated < minRequired * 0.5,
            };
        }

        res.json({
            internshipId: internship._id,
            title: internship.title,
            totalSeats: internship.totalSeats,
            filledSeats: internship.filledSeats,
            quotaStatus: status,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// ─── POST /api/quota/check ────────────────────────────────────────────────────
// Check if a candidate is eligible for a specific internship
router.post('/check', async (req, res) => {
    const { candidateId, internshipId } = req.body;
    const Candidate = require('../models/Candidate');
    const { getCandidateCategory } = require('../middleware/quotaMiddleware');

    try {
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) return res.status(404).json({ eligible: false, reason: 'Candidate not found' });

        if (candidate.pastParticipation) {
            return res.json({
                eligible: false,
                reason: 'Already participated in PM Internship Scheme',
            });
        }

        const category = getCandidateCategory(candidate);
        const quota = await QuotaAllocation.findOne({ internshipId, category });

        if (!quota) {
            return res.json({ eligible: true, category, reason: 'Quota not yet initialized — eligible by default' });
        }

        if (quota.allocated >= quota.capacity) {
            return res.json({
                eligible: false,
                category,
                reason: `${category.toUpperCase()} quota is full for this internship`,
                quota: { capacity: quota.capacity, allocated: quota.allocated, available: 0 },
            });
        }

        res.json({
            eligible: true,
            category,
            reason: 'Eligible',
            quota: { capacity: quota.capacity, allocated: quota.allocated, available: quota.available },
        });
    } catch (err) {
        res.status(500).json({ eligible: false, reason: err.message });
    }
});

// ─── POST /api/quota/initialize/:internshipId ─────────────────────────────────
// Initialize quota records for an internship
router.post('/initialize/:internshipId', async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.internshipId);
        if (!internship) return res.status(404).json({ message: 'Internship not found' });

        const categories = ['general', 'obc', 'sc', 'st', 'rural', 'aspirational'];
        const capacities = computeQuotaCapacities(internship.totalSeats);

        const records = [];
        for (const cat of categories) {
            const record = await QuotaAllocation.findOneAndUpdate(
                { internshipId: internship._id, category: cat },
                { capacity: capacities[cat] },
                { upsert: true, new: true }
            );
            records.push(record);
        }

        res.json({ message: 'Quota initialized', records });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// ─── POST /api/quota/initialize-all ──────────────────────────────────────────
// Initialize quota for ALL open internships at once
router.post('/initialize-all', async (req, res) => {
    try {
        const internships = await Internship.find({ status: 'Open' });
        const categories = ['general', 'obc', 'sc', 'st', 'rural', 'aspirational'];
        let initialized = 0;

        for (const internship of internships) {
            const capacities = computeQuotaCapacities(internship.totalSeats);
            for (const cat of categories) {
                await QuotaAllocation.findOneAndUpdate(
                    { internshipId: internship._id, category: cat },
                    { capacity: capacities[cat] },
                    { upsert: true }
                );
            }
            initialized++;
        }

        res.json({ message: `Quota initialized for ${initialized} internships` });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;