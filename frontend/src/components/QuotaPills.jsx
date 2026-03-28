// frontend/src/components/QuotaPills.jsx
// Shows quota availability pills on internship cards
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5001/api';

const CATEGORY_LABELS = {
    sc: 'SC',
    st: 'ST',
    obc: 'OBC',
    general: 'General',
    rural: 'Rural',
    aspirational: 'Aspirational',
};

const CATEGORY_COLORS = {
    sc: 'bg-purple-100 text-purple-700 border-purple-200',
    st: 'bg-red-100    text-red-700    border-red-200',
    obc: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    general: 'bg-gray-100   text-gray-700   border-gray-200',
    rural: 'bg-green-100  text-green-700  border-green-200',
    aspirational: 'bg-blue-100   text-blue-700   border-blue-200',
};

const QuotaPills = ({ internshipId }) => {
    const [quota, setQuota] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!internshipId) return;
        axios.get(`${API}/quota/status/${internshipId}`)
            .then(r => setQuota(r.data.quotaStatus))
            .catch(() => setQuota(null))
            .finally(() => setLoading(false));
    }, [internshipId]);

    if (loading) return (
        <div className="flex gap-1 flex-wrap mt-2">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
            ))}
        </div>
    );

    if (!quota) return null;

    const mainCategories = ['sc', 'st', 'obc', 'general'];

    return (
        <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1 font-medium">Quota Availability</p>
            <div className="flex flex-wrap gap-1">
                {mainCategories.map(cat => {
                    const q = quota[cat];
                    if (!q) return null;
                    const isFull = q.available === 0;
                    const atRisk = q.atRisk;
                    return (
                        <span
                            key={cat}
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium
                ${isFull
                                    ? 'bg-red-50 text-red-600 border-red-200'
                                    : atRisk
                                        ? 'bg-orange-50 text-orange-600 border-orange-200'
                                        : CATEGORY_COLORS[cat]
                                }`}
                        >
                            {CATEGORY_LABELS[cat]}: {isFull ? 'Full' : `${q.available} left`}
                            {atRisk && !isFull ? ' ⚠️' : ''}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

export default QuotaPills;