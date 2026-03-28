/**
 * backend/routes/allocationRoutes.js
 * Core allocation engine API
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const Candidate = require('../models/Candidate');
const Internship = require('../models/Internship');
const Allocation = require('../models/Allocation');
const QuotaAllocation = require('../models/QuotaAllocation');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5002';

// ─── Helper: get candidate quota category ─────────────────────────────────────
function getCandidateCategory(candidate) {
    const social = (candidate.socialCategory || 'General').toLowerCase();
    const district = (candidate.districtType || 'Urban').toLowerCase();
    if (district === 'aspirational') return 'aspirational';
    if (district === 'rural') return 'rural';
    if (['sc', 'st', 'obc'].includes(social)) return social;
    return 'general';
}

// ─── Helper: compute quota capacities ────────────────────────────────────────
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

// ─── POST /api/allocations/run-allocation ─────────────────────────────────────
router.post('/run-allocation', async (req, res) => {
    try {
        console.log('🚀 Starting allocation cycle...');

        // 1. Fetch unallocated candidates
        const allocatedCandidateIds = await Allocation.distinct('candidateId', {
            status: { $in: ['Pending', 'Accepted'] }
        });

        const candidates = await Candidate.find({
            _id: { $nin: allocatedCandidateIds },
            pastParticipation: false,
        }).lean();

        // 2. Fetch open internships
        const internships = await Internship.find({ status: 'Open' }).lean();

        if (!candidates.length || !internships.length) {
            return res.json({
                success: true,
                message: 'No candidates or internships available for allocation',
                summary: { matched: 0, waitlisted: 0, unmatched: candidates.length },
            });
        }

        console.log(`📊 Processing ${candidates.length} candidates × ${internships.length} internships`);

        // 3. Get full match matrix from Flask
        const { data: mlData } = await axios.post(`${ML_URL}/match/bulk`, {
            candidates,
            internships,
        });

        const matrix = mlData.matrix; // array of arrays

        // 4. Initialize quota tracking
        const quotaMap = {}; // internshipId → { category → { capacity, allocated } }
        for (const internship of internships) {
            const iid = internship._id.toString();
            const caps = computeQuotaCapacities(internship.totalSeats);
            quotaMap[iid] = {};

            for (const [cat, cap] of Object.entries(caps)) {
                // Get existing quota record
                const existing = await QuotaAllocation.findOne({
                    internshipId: internship._id,
                    category: cat,
                });
                quotaMap[iid][cat] = {
                    capacity: existing?.capacity ?? cap,
                    allocated: existing?.allocated ?? 0,
                };
            }
        }

        // 5. Greedy allocation — highest score first with quota constraints
        // Build flat list of all (candidateIdx, internshipIdx, score) sorted by score desc
        const flatScores = [];
        for (let ci = 0; ci < matrix.length; ci++) {
            for (let ii = 0; ii < matrix[ci].length; ii++) {
                flatScores.push({
                    ci,
                    ii,
                    candidateId: candidates[ci]._id.toString(),
                    internshipId: internships[ii]._id.toString(),
                    score: matrix[ci][ii].matchScore,
                });
            }
        }
        flatScores.sort((a, b) => b.score - a.score);

        const allocatedCandidates = new Set();
        const internshipSeatCount = {}; // internshipId → seats filled
        const allocationResults = [];
        const waitlistMap = {}; // internshipId → [{ candidateId, score, category }]

        // Initialize seat counters
        for (const i of internships) {
            internshipSeatCount[i._id.toString()] = i.filledSeats || 0;
        }

        // Greedy pass
        for (const entry of flatScores) {
            const { candidateId, internshipId, score, ci, ii } = entry;

            // Skip if candidate already allocated
            if (allocatedCandidates.has(candidateId)) continue;

            const internship = internships[ii];
            const candidate = candidates[ci];
            const iid = internshipId;
            const category = getCandidateCategory(candidate);

            // Check total seats
            const totalFilled = internshipSeatCount[iid] || 0;
            if (totalFilled >= internship.totalSeats) continue;

            // Check quota availability
            const quotaSlot = quotaMap[iid]?.[category];
            if (!quotaSlot || quotaSlot.allocated >= quotaSlot.capacity) {
                // Add to waitlist
                if (!waitlistMap[iid]) waitlistMap[iid] = [];
                waitlistMap[iid].push({ candidateId, score, category, candidate });
                continue;
            }

            // ✅ Allocate
            allocatedCandidates.add(candidateId);
            quotaMap[iid][category].allocated++;
            internshipSeatCount[iid]++;

            allocationResults.push({
                candidateId: candidate._id,
                internshipId: internship._id,
                matchScore: score,
                status: 'Pending',
                quotaCategory: category,
                allocationReason: `Score ${score}% — matched via greedy allocation (${category} quota)`,
                responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });
        }

        // 6. Process waitlist — rank unallocated by best score per internship
        const waitlistedResults = [];
        const unallocatedCandidates = candidates.filter(
            c => !allocatedCandidates.has(c._id.toString())
        );

        // For each unallocated candidate, find their best internship and add to waitlist
        for (const candidate of unallocatedCandidates) {
            const ci = candidates.findIndex(c => c._id.toString() === candidate._id.toString());
            const scores = matrix[ci] || [];
            const bestMatch = scores.reduce((best, curr) =>
                curr.matchScore > (best?.matchScore || 0) ? curr : best, null
            );

            if (bestMatch) {
                const iid = bestMatch.internshipId;
                const position = (waitlistMap[iid] || []).findIndex(
                    w => w.candidateId === candidate._id.toString()
                );
                const waitlistPos = position >= 0 ? position + 1 : 99;

                waitlistedResults.push({
                    candidateId: candidate._id,
                    internshipId: bestMatch.internshipId,
                    matchScore: bestMatch.matchScore,
                    status: 'Waitlisted',
                    quotaCategory: getCandidateCategory(candidate),
                    allocationReason: `Waitlisted — quota full or seats unavailable`,
                    waitlistPosition: waitlistPos,
                });
            }
        }

        // 7. Save to DB (upsert to avoid duplicates)
        let savedMatched = 0;
        let savedWaitlisted = 0;

        for (const alloc of allocationResults) {
            try {
                await Allocation.findOneAndUpdate(
                    { candidateId: alloc.candidateId, internshipId: alloc.internshipId },
                    alloc,
                    { upsert: true, new: true }
                );
                savedMatched++;
            } catch (e) {
                console.error('Allocation save error:', e.message);
            }
        }

        for (const alloc of waitlistedResults) {
            try {
                await Allocation.findOneAndUpdate(
                    { candidateId: alloc.candidateId, internshipId: alloc.internshipId },
                    alloc,
                    { upsert: true, new: true }
                );
                savedWaitlisted++;
            } catch (e) {
                console.error('Waitlist save error:', e.message);
            }
        }

        // 8. Update QuotaAllocation records in DB
        for (const [iid, cats] of Object.entries(quotaMap)) {
            for (const [cat, data] of Object.entries(cats)) {
                await QuotaAllocation.findOneAndUpdate(
                    { internshipId: iid, category: cat },
                    { allocated: data.allocated, capacity: data.capacity },
                    { upsert: true }
                );
            }
        }

        // 9. Update internship filledSeats
        for (const [iid, filled] of Object.entries(internshipSeatCount)) {
            await Internship.findByIdAndUpdate(iid, { filledSeats: filled });
        }

        const unmatched = candidates.length - savedMatched - savedWaitlisted;

        console.log(`✅ Allocation complete: ${savedMatched} matched, ${savedWaitlisted} waitlisted, ${Math.max(0, unmatched)} unmatched`);

        res.json({
            success: true,
            summary: {
                totalCandidates: candidates.length,
                totalInternships: internships.length,
                matched: savedMatched,
                waitlisted: savedWaitlisted,
                unmatched: Math.max(0, unmatched),
            },
        });

    } catch (err) {
        console.error('Allocation error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/allocations/candidate/:id ──────────────────────────────────────
router.get('/candidate/:id', async (req, res) => {
    try {
        const allocation = await Allocation.findOne({ candidateId: req.params.id })
            .populate('internshipId', 'title sector location stipend duration companyId')
            .populate('internshipId.companyId', 'companyName')
            .lean();

        if (!allocation) return res.json({ allocation: null });
        res.json({ allocation });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/allocations/internship/:id ─────────────────────────────────────
router.get('/internship/:id', async (req, res) => {
    try {
        const allocations = await Allocation.find({ internshipId: req.params.id })
            .populate('candidateId', 'fullName email socialCategory districtType education')
            .sort({ matchScore: -1 })
            .lean();

        res.json({ count: allocations.length, allocations });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── PUT /api/allocations/:id/respond ────────────────────────────────────────
router.put('/:id/respond', async (req, res) => {
    const { response } = req.body; // 'Accepted' or 'Rejected'

    if (!['Accepted', 'Rejected'].includes(response)) {
        return res.status(400).json({ message: 'Response must be Accepted or Rejected' });
    }

    try {
        const allocation = await Allocation.findById(req.params.id);
        if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
        if (allocation.status !== 'Pending') {
            return res.status(400).json({ message: `Already ${allocation.status}` });
        }

        allocation.status = response;
        allocation.respondedAt = new Date();
        await allocation.save();

        // If rejected, trigger reallocation from waitlist
        if (response === 'Rejected') {
            await reallocateFromWaitlist(allocation.internshipId, allocation.quotaCategory);
        }

        // Mark candidate as past participant if accepted
        if (response === 'Accepted') {
            await Candidate.findByIdAndUpdate(allocation.candidateId, {
                pastParticipation: true,
            });
        }

        res.json({ success: true, allocation });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── POST /api/allocations/reallocate/:internshipId ───────────────────────────
router.post('/reallocate/:internshipId', async (req, res) => {
    try {
        const result = await reallocateFromWaitlist(
            req.params.internshipId,
            req.body.category
        );
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── Helper: reallocate from waitlist ─────────────────────────────────────────
async function reallocateFromWaitlist(internshipId, category) {
    const waitlisted = await Allocation.find({
        internshipId,
        status: 'Waitlisted',
        quotaCategory: category,
    }).sort({ matchScore: -1 }).limit(1);

    if (!waitlisted.length) return { message: 'No waitlisted candidates' };

    const next = waitlisted[0];
    next.status = 'Pending';
    next.waitlistPosition = null;
    next.allocatedAt = new Date();
    next.allocationReason = 'Reallocated from waitlist';
    await next.save();

    // Update quota
    await QuotaAllocation.findOneAndUpdate(
        { internshipId, category },
        { $inc: { allocated: 1 } }
    );

    return { message: 'Reallocated from waitlist', allocation: next };
}

module.exports = router;