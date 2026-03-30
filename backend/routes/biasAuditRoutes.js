/**
 * backend/routes/biasAuditRoutes.js
 * Fairness audit — checks average scores by category/district
 */

const express = require('express');
const router = express.Router();
const Allocation = require('../models/Allocation');
const Candidate = require('../models/Candidate');

// ─── GET /api/bias-audit/run ──────────────────────────────────────────────────
router.get('/run', async (req, res) => {
    try {
        // Fetch all allocations with candidate data
        const allocations = await Allocation.find()
            .populate('candidateId', 'socialCategory districtType')
            .lean();

        if (!allocations.length) {
            return res.json({ message: 'No allocations found', audit: null });
        }

        const overall = allocations.reduce((s, a) => s + a.matchScore, 0) / allocations.length;

        // Group by social category
        const byCategory = {};
        const byDistrict = {};

        for (const alloc of allocations) {
            const cat = alloc.candidateId?.socialCategory || 'General';
            const dist = alloc.candidateId?.districtType || 'Urban';

            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(alloc.matchScore);

            if (!byDistrict[dist]) byDistrict[dist] = [];
            byDistrict[dist].push(alloc.matchScore);
        }

        // Compute averages and flags
        const THRESHOLD = 15; // flag if > 15% below overall

        const categoryAudit = Object.entries(byCategory).map(([cat, scores]) => {
            const avg = scores.reduce((s, x) => s + x, 0) / scores.length;
            const diff = overall - avg;
            return {
                category: cat,
                count: scores.length,
                avgScore: Math.round(avg * 10) / 10,
                diff: Math.round(diff * 10) / 10,
                flagged: diff > THRESHOLD,
                warning: diff > THRESHOLD
                    ? `⚠️ ${cat} candidates score ${Math.round(diff)}% below average. Consider reviewing skill weight factors.`
                    : null,
            };
        });

        const districtAudit = Object.entries(byDistrict).map(([dist, scores]) => {
            const avg = scores.reduce((s, x) => s + x, 0) / scores.length;
            const diff = overall - avg;
            return {
                district: dist,
                count: scores.length,
                avgScore: Math.round(avg * 10) / 10,
                diff: Math.round(diff * 10) / 10,
                flagged: diff > THRESHOLD,
                warning: diff > THRESHOLD
                    ? `⚠️ ${dist} candidates score ${Math.round(diff)}% below average.`
                    : null,
            };
        });

        // Allocation rate by category
        const allCandidates = await Candidate.find().lean();
        const allocatedIds = new Set(allocations.map(a => a.candidateId?._id?.toString()));

        const allocationRates = {};
        for (const c of allCandidates) {
            const cat = c.socialCategory || 'General';
            if (!allocationRates[cat]) allocationRates[cat] = { total: 0, allocated: 0 };
            allocationRates[cat].total++;
            if (allocatedIds.has(c._id.toString())) allocationRates[cat].allocated++;
        }

        const allocationRateAudit = Object.entries(allocationRates).map(([cat, data]) => ({
            category: cat,
            total: data.total,
            allocated: data.allocated,
            allocationRate: Math.round((data.allocated / data.total) * 100),
        }));

        const flagCount = [...categoryAudit, ...districtAudit].filter(x => x.flagged).length;

        res.json({
            overallAvgScore: Math.round(overall * 10) / 10,
            totalAllocations: allocations.length,
            flagCount,
            categoryAudit,
            districtAudit,
            allocationRateAudit,
            generatedAt: new Date().toISOString(),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;