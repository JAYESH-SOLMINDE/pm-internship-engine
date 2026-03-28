/**
 * backend/routes/matchRoutes.js
 * Proxy route — Node calls Flask ML service and returns results to frontend
 */

const express = require('express');
const axios   = require('axios');
const router  = express.Router();

const Candidate  = require('../models/Candidate');
const Internship = require('../models/Internship');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5002';

// ─── GET /api/match/internship/:internshipId ──────────────────────────────────
// MUST be before /:candidateId to avoid route conflict
router.get('/internship/:internshipId', async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.internshipId).lean();
        if (!internship) return res.status(404).json({ message: 'Internship not found' });

        const candidates = await Candidate.find({}).lean();
        if (!candidates.length) return res.json({ matches: [], total: 0 });

        const topN = parseInt(req.query.topN) || 20;

        const { data } = await axios.post(`${ML_URL}/match/internship`, {
            internship,
            candidates,
            topN,
        });

        res.json(data);
    } catch (err) {
        console.error('Match internship error:', err.message);
        res.status(500).json({ message: 'Matching service error', error: err.message });
    }
});

// ─── POST /api/match/bulk ─────────────────────────────────────────────────────
router.post('/bulk', async (req, res) => {
    try {
        const { candidateIds, internshipIds } = req.body;

        const candidates = candidateIds?.length
            ? await Candidate.find({ _id: { $in: candidateIds } }).lean()
            : await Candidate.find({}).lean();

        const internships = internshipIds?.length
            ? await Internship.find({ _id: { $in: internshipIds } }).lean()
            : await Internship.find({ status: 'Open' }).lean();

        const { data } = await axios.post(`${ML_URL}/match/bulk`, {
            candidates,
            internships,
        });

        res.json(data);
    } catch (err) {
        console.error('Bulk match error:', err.message);
        res.status(500).json({ message: 'Matching service error', error: err.message });
    }
});

// ─── GET /api/match/:candidateId ─────────────────────────────────────────────
// MUST be last to avoid swallowing other routes
router.get('/:candidateId', async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.candidateId).lean();
        if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

        const internships = await Internship.find({ status: 'Open' }).lean();
        if (!internships.length) return res.json({ matches: [], total: 0 });

        const topN = parseInt(req.query.topN) || 10;

        const { data } = await axios.post(`${ML_URL}/match/candidate`, {
            candidate,
            internships,
            topN,
        });

        res.json(data);
    } catch (err) {
        console.error('Match route error:', err.message);
        console.error('Axios error details:', {
            message: err.message,
            code: err.code,
            response: err.response?.data,
            config_url: err.config?.url,
        });
        res.status(500).json({
            message: 'Matching service error',
            error: err.message,
            code: err.code,
        });
    }
});

module.exports = router;