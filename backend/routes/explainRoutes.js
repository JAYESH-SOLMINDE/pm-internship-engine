/**
 * backend/routes/explainRoutes.js
 * Explainable AI — per-factor breakdown with text reasons
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const Candidate = require('../models/Candidate');
const Internship = require('../models/Internship');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5002';

// ─── Skill gap → course mapping ───────────────────────────────────────────────
const SKILL_COURSES = {
    'sql': { name: 'SQL', url: 'https://swayam.gov.in/nd1_noc19_cs47' },
    'python': { name: 'Python', url: 'https://swayam.gov.in/nd1_noc20_cs62' },
    'data analysis': { name: 'Data Analysis', url: 'https://nptel.ac.in/courses/106/106/106106177/' },
    'machine learning': { name: 'Machine Learning', url: 'https://swayam.gov.in/nd1_noc20_cs82' },
    'excel': { name: 'Excel', url: 'https://www.coursera.org/learn/excel-basics-data-analysis-ibm' },
    'data visualization': { name: 'Data Visualization', url: 'https://www.coursera.org/learn/datavisualization' },
    'tally': { name: 'Tally', url: 'https://tallysolutions.com/tally-prime/' },
    'accounting': { name: 'Accounting', url: 'https://swayam.gov.in/nd2_arp19_ap24' },
    'autocad': { name: 'AutoCAD', url: 'https://www.autodesk.com/certification/learn/catalog' },
    'financial modeling': { name: 'Financial Modeling', url: 'https://www.coursera.org/learn/financial-analysis' },
    'power bi': { name: 'Power BI', url: 'https://docs.microsoft.com/en-us/learn/powerbi/' },
    'deep learning': { name: 'Deep Learning', url: 'https://swayam.gov.in/nd1_noc20_cs82' },
    'gis': { name: 'GIS', url: 'https://www.esri.com/training/catalog/search/' },
    'quality control': { name: 'Quality Control', url: 'https://nptel.ac.in/courses/112/107/112107144/' },
    'research': { name: 'Research Methods', url: 'https://swayam.gov.in/nd1_noc18_hs01' },
    'ms office': { name: 'MS Office', url: 'https://www.microsoft.com/en-us/microsoft-365/free-office-online-for-the-web' },
};

function getCourseForSkill(skill) {
    const key = skill.toLowerCase();
    return SKILL_COURSES[key] || {
        name: skill,
        url: `https://swayam.gov.in/explorer?searchText=${encodeURIComponent(skill)}`,
    };
}

// ─── GET /api/explain/:candidateId/:internshipId ──────────────────────────────
router.get('/:candidateId/:internshipId', async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.candidateId).lean();
        const internship = await Internship.findById(req.params.internshipId)
            .populate('companyId', 'companyName').lean();

        if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
        if (!internship) return res.status(404).json({ message: 'Internship not found' });

        // Call Flask for score
        const allSkills = [...new Set([
            ...(candidate.skills || []),
            ...(candidate.parsedSkills || []),
        ])];

        const { data: mlData } = await axios.post(`${ML_URL}/match/candidate`, {
            candidate,
            internships: [internship],
            topN: 1,
        });

        const match = mlData.matches?.[0];
        const breakdown = match?.breakdown || {};
        const score = match?.matchScore || 0;

        // Skill gap analysis
        const requiredSkills = (internship.skillsRequired || []).map(s => s.toLowerCase());
        const candidateSkills = allSkills.map(s => s.toLowerCase());
        const matchedSkills = requiredSkills.filter(s => candidateSkills.includes(s));
        const missingSkills = requiredSkills.filter(s => !candidateSkills.includes(s));

        // Location explanation
        const candCity = (candidate.locationPreference?.city || '').toLowerCase();
        const candState = (candidate.locationPreference?.state || '').toLowerCase();
        const intCity = (internship.location?.city || '').toLowerCase();
        const intState = (internship.location?.state || '').toLowerCase();
        const relocate = candidate.locationPreference?.willingToRelocate;

        let locationReason = '';
        if (candCity && candCity === intCity) locationReason = `Your preferred city (${internship.location.city}) matches ✅`;
        else if (candState && candState === intState) locationReason = `Same state (${internship.location.state}) ✅`;
        else if (relocate) locationReason = 'You are willing to relocate ✓';
        else locationReason = `Different location (${internship.location.city}, ${internship.location.state})`;

        // Sector explanation
        const sectorMatch = (candidate.sectorInterest || [])
            .map(s => s.toLowerCase())
            .includes((internship.sector || '').toLowerCase());
        const sectorReason = sectorMatch
            ? `Both are ${internship.sector} ✅`
            : `Your interests don't include ${internship.sector}`;

        // Qualification explanation
        const degree = candidate.education?.degree || '';
        const qualReason = degree
            ? `${degree} degree matched for this internship`
            : 'No degree information provided';

        // Category bonus
        const social = candidate.socialCategory || 'General';
        const district = candidate.districtType || 'Urban';
        const hasBonus = ['SC', 'ST', 'OBC'].includes(social) || ['Rural', 'Aspirational'].includes(district);
        const bonusReason = hasBonus
            ? `Affirmative action bonus applied (${social}${district !== 'Urban' ? ' · ' + district : ''}) ✅`
            : 'No affirmative action bonus';

        // Overall strength
        let strength = 'Weak Match';
        if (score >= 75) strength = 'Excellent Match 🌟';
        else if (score >= 55) strength = 'Strong Match ✅';
        else if (score >= 40) strength = 'Moderate Match';

        // Missing skill courses
        const missingWithCourses = missingSkills.map(skill => ({
            skill,
            course: getCourseForSkill(skill),
        }));

        res.json({
            candidateName: candidate.fullName,
            internshipTitle: internship.title,
            companyName: internship.companyId?.companyName || '',
            matchScore: score,
            strength,
            factors: {
                skills: {
                    score: breakdown.skills || 0,
                    matched: matchedSkills,
                    missing: missingSkills,
                    candidateHas: allSkills,
                    internshipNeeds: internship.skillsRequired || [],
                    reason: `You have ${matchedSkills.length}/${requiredSkills.length} required skills`,
                },
                location: {
                    score: breakdown.location || 0,
                    reason: locationReason,
                },
                sector: {
                    score: breakdown.sector || 0,
                    reason: sectorReason,
                },
                qualification: {
                    score: breakdown.qualification || 0,
                    reason: qualReason,
                },
                categoryBonus: {
                    score: breakdown.categoryBonus || 0,
                    reason: bonusReason,
                },
            },
            skillGap: {
                missingCount: missingSkills.length,
                missingWithCourses,
                awayFromQualifying: missingSkills.length,
            },
        });
    } catch (err) {
        console.error('Explain route error:', err.message);
        res.status(500).json({ message: err.message });
    }
});

module.exports = { router, SKILL_COURSES, getCourseForSkill };