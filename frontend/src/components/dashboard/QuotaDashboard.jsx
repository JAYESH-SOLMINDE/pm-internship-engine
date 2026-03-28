// frontend/src/components/dashboard/QuotaDashboard.jsx
// Shows quota progress bars per internship for admin view
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5001/api';

const CATEGORY_COLORS = {
    sc: { bar: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
    st: { bar: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
    obc: { bar: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
    general: { bar: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
    rural: { bar: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
    aspirational: { bar: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
};

const QuotaBar = ({ category, data }) => {
    if (!data) return null;
    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.general;
    const pct = data.capacity > 0 ? Math.round((data.allocated / data.capacity) * 100) : 0;
    const label = category.charAt(0).toUpperCase() + category.slice(1);

    return (
        <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                    {label}
                </span>
                <span className="text-xs text-gray-500">
                    {data.allocated}/{data.capacity} seats
                    {data.atRisk && (
                        <span className="ml-1 text-orange-500 font-bold">⚠️ At Risk</span>
                    )}
                </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>{pct}% filled</span>
                <span>{data.available} available</span>
            </div>
        </div>
    );
};

const QuotaCard = ({ internshipId, title }) => {
    const [quota, setQuota] = useState(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        axios.get(`${API}/quota/status/${internshipId}`)
            .then(r => setQuota(r.data))
            .catch(() => setQuota(null))
            .finally(() => setLoading(false));
    }, [internshipId, open]);

    const categories = ['sc', 'st', 'obc', 'general', 'rural', 'aspirational'];
    const atRiskCount = quota
        ? categories.filter(c => quota.quotaStatus?.[c]?.atRisk).length
        : 0;

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setOpen(!open)}
            >
                <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{title}</h4>
                    {atRiskCount > 0 && (
                        <span className="text-xs text-orange-500 font-medium">
                            ⚠️ {atRiskCount} category{atRiskCount > 1 ? 's' : ''} at risk
                        </span>
                    )}
                </div>
                <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
            </div>

            {open && (
                <div className="mt-4">
                    {loading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : quota ? (
                        <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-3">
                                <span>Total Seats: {quota.totalSeats}</span>
                                <span>Filled: {quota.filledSeats}</span>
                            </div>
                            {categories.map(cat => (
                                <QuotaBar key={cat} category={cat} data={quota.quotaStatus?.[cat]} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">Failed to load quota data.</p>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Main QuotaDashboard ──────────────────────────────────────────────────────
const QuotaDashboard = () => {
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(false);

    useEffect(() => {
        axios.get(`${API}/internships/all`)
            .then(r => setInternships(r.data.internships || []))
            .catch(() => setInternships([]))
            .finally(() => setLoading(false));
    }, []);

    const handleInitializeAll = async () => {
        setInitializing(true);
        try {
            await axios.post(`${API}/quota/initialize-all`);
            alert('✅ Quota initialized for all internships!');
        } catch {
            alert('❌ Failed to initialize quota.');
        } finally {
            setInitializing(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Quota Compliance Dashboard</h2>
                    <p className="text-sm text-gray-500">Monitor affirmative action seat allocation</p>
                </div>
                <button
                    onClick={handleInitializeAll}
                    disabled={initializing}
                    className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                    {initializing ? 'Initializing...' : '⚙️ Initialize All Quotas'}
                </button>
            </div>

            {/* Quota Rules Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {[
                    { label: 'General', rule: 'Max 50%', color: 'bg-blue-50   text-blue-700' },
                    { label: 'OBC', rule: 'Min 27%', color: 'bg-yellow-50 text-yellow-700' },
                    { label: 'SC', rule: 'Min 15%', color: 'bg-purple-50 text-purple-700' },
                    { label: 'ST', rule: 'Min 7.5%', color: 'bg-red-50    text-red-700' },
                    { label: 'Rural', rule: 'Min 10%', color: 'bg-green-50  text-green-700' },
                    { label: 'Aspirational', rule: 'Min 5%', color: 'bg-indigo-50 text-indigo-700' },
                ].map(({ label, rule, color }) => (
                    <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
                        <div className="font-bold text-sm">{label}</div>
                        <div className="text-xs opacity-75 mt-0.5">{rule}</div>
                    </div>
                ))}
            </div>

            {/* Per-Internship Quota Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : internships.length === 0 ? (
                <p className="text-center text-gray-400 py-10">No internships found.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {internships.map(i => (
                        <QuotaCard
                            key={i._id}
                            internshipId={i._id}
                            title={i.title}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuotaDashboard;