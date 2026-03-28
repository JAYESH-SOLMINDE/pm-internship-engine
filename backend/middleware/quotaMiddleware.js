/**
 * backend/middleware/quotaMiddleware.js
 * Checks if a candidate is eligible for a specific internship
 * based on quota rules and past participation.
 */

const Candidate = require('../models/Candidate');
const QuotaAllocation = require('../models/QuotaAllocation');

// ─── Quota Rules (PM Internship Scheme) ──────────────────────────────────────
const QUOTA_RULES = {
    general: { minPct: 0, maxPct: 0.50 },
    obc: { minPct: 0.27, maxPct: 1.00 },
    sc: { minPct: 0.15, maxPct: 1.00 },
    st: { minPct: 0.075, maxPct: 1.00 },
    rural: { minPct: 0.30, maxPct: 1.00 },
    aspirational: { minPct: 0.30, maxPct: 1.00 },
};

// ─── Map candidate fields to quota categories ─────────────────────────────────
function getCandidateCategory(candidate) {
    const social = (candidate.socialCategory || 'General').toLowerCase();
    const district = (candidate.districtType || 'Urban').toLowerCase();

    // District type takes precedence for rural/aspirational
    if (district === 'aspirational') return 'aspirational';
    if (district === 'rural') return 'rural';

    // Social category
    if (['sc', 'st', 'obc'].includes(social)) return social;
    return 'general';
}

// ─── checkQuotaEligibility middleware ────────────────────────────────────────
const checkQuotaEligibility = async (req, res, next) => {
    try {
        const { candidateId, internshipId } = req.body;

        if (!candidateId || !internshipId) {
            return res.status(400).json({
                eligible: false,
                reason: 'candidateId and internshipId are required',
            });
        }

        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ eligible: false, reason: 'Candidate not found' });
        }

        // Check past participation
        if (candidate.pastParticipation) {
            return res.status(200).json({
                eligible: false,
                reason: 'Candidate has already participated in the PM Internship Scheme',
            });
        }

        // Determine candidate quota category
        const category = getCandidateCategory(candidate);

        // Check quota availability
        const quota = await QuotaAllocation.findOne({ internshipId, category });
        if (!quota) {
            // No quota record yet — allow by default
            req.quotaCategory = category;
            return next();
        }

        if (quota.allocated >= quota.capacity) {
            return res.status(200).json({
                eligible: false,
                reason: `No seats available in ${category.toUpperCase()} quota for this internship`,
                quotaStatus: {
                    category,
                    capacity: quota.capacity,
                    allocated: quota.allocated,
                    available: quota.available,
                },
            });
        }

        // Eligible
        req.quotaCategory = category;
        req.quotaRecord = quota;
        next();

    } catch (err) {
        console.error('Quota middleware error:', err.message);
        res.status(500).json({ eligible: false, reason: 'Server error during quota check' });
    }
};

module.exports = { checkQuotaEligibility, getCandidateCategory, QUOTA_RULES };