// frontend/src/components/ExplainModal.jsx
// "Why this match?" explainable AI modal

import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5001/api';

// ─── Factor Bar ───────────────────────────────────────────────────────────────
const FactorBar = ({ label, score, reason, color }) => (
    <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-gray-700">{label}</span>
            <span className={`text-sm font-bold ${score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                {score}%
            </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full mb-1.5">
            <div className={`h-full ${color} rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(score, 100)}%` }} />
        </div>
        <p className="text-xs text-gray-500">{reason}</p>
    </div>
);

// ─── Skill Tag ────────────────────────────────────────────────────────────────
const SkillTag = ({ skill, matched }) => (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${matched
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50   text-red-600   border-red-200'
        }`}>
        {matched ? '✓' : '✗'} {skill}
    </span>
);

// ─── Main ExplainModal ────────────────────────────────────────────────────────
const ExplainModal = ({ candidateId, internship, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    React.useEffect(() => {
        axios.get(`${API}/explain/${candidateId}/${internship._id}`)
            .then(r => setData(r.data))
            .catch(e => setError(e.response?.data?.message || 'Failed to load explanation'))
            .finally(() => setLoading(false));
    }, [candidateId, internship._id]);

    const strengthColor = {
        'Excellent Match 🌟': 'bg-green-100 text-green-800 border-green-200',
        'Strong Match ✅': 'bg-blue-100  text-blue-800  border-blue-200',
        'Moderate Match': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Weak Match': 'bg-red-100   text-red-800   border-red-200',
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                    <div>
                        <h2 className="font-bold text-gray-900">Why This Match?</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{internship.title}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
                </div>

                <div className="p-6">
                    {loading && (
                        <div className="text-center py-10">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">Generating AI explanation...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    {data && (
                        <div>
                            {/* Overall strength badge */}
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm mb-6 ${strengthColor[data.strength] || strengthColor['Weak Match']}`}>
                                Overall: {data.strength}
                                <span className="font-normal">({data.matchScore}%)</span>
                            </div>

                            {/* Factor breakdown */}
                            <div className="mb-6">
                                <h3 className="font-bold text-gray-800 mb-4">Score Breakdown</h3>
                                <FactorBar label="Skills Match" score={data.factors.skills.score} reason={data.factors.skills.reason} color="bg-blue-500" />
                                <FactorBar label="Location Match" score={data.factors.location.score} reason={data.factors.location.reason} color="bg-green-500" />
                                <FactorBar label="Sector Match" score={data.factors.sector.score} reason={data.factors.sector.reason} color="bg-purple-500" />
                                <FactorBar label="Qualification" score={data.factors.qualification.score} reason={data.factors.qualification.reason} color="bg-yellow-500" />
                                <FactorBar label="Category Bonus" score={data.factors.categoryBonus.score} reason={data.factors.categoryBonus.reason} color="bg-pink-500" />
                            </div>

                            {/* Skills detail */}
                            <div className="mb-6">
                                <h3 className="font-bold text-gray-800 mb-3">Skills Analysis</h3>
                                <p className="text-sm text-gray-500 mb-3">
                                    You have <span className="font-bold text-green-600">{data.factors.skills.matched.length}</span> of{' '}
                                    <span className="font-bold">{data.factors.skills.internshipNeeds.length}</span> required skills
                                    {data.factors.skills.missing.length > 0 && (
                                        <span className="text-red-500"> (missing: {data.factors.skills.missing.join(', ')})</span>
                                    )}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {data.factors.skills.internshipNeeds.map(s => (
                                        <SkillTag
                                            key={s}
                                            skill={s}
                                            matched={data.factors.skills.matched.map(x => x.toLowerCase()).includes(s.toLowerCase())}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Skill Gap + Courses */}
                            {data.skillGap.missingWithCourses.length > 0 && (
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                    <h4 className="font-bold text-orange-800 text-sm mb-2">
                                        🎯 You are {data.skillGap.awayFromQualifying} skill{data.skillGap.awayFromQualifying > 1 ? 's' : ''} away from a stronger match
                                    </h4>
                                    <div className="space-y-2">
                                        {data.skillGap.missingWithCourses.map(({ skill, course }) => (
                                            <div key={skill} className="flex items-center justify-between">
                                                <span className="text-sm text-orange-700 font-medium">{skill}</span>
                                                <a href={course.url} target="_blank" rel="noreferrer"
                                                    className="text-xs bg-orange-600 text-white px-3 py-1 rounded-full hover:bg-orange-700">
                                                    Learn on SWAYAM →
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExplainModal;