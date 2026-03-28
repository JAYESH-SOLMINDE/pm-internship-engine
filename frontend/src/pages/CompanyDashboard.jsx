// frontend/src/pages/CompanyDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';
import PostInternshipModal from '../components/PostInternshipModal';
import QuotaDashboard from '../components/dashboard/QuotaDashboard';
import RunAllocation from '../components/dashboard/RunAllocation';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function StatusBadge({ status }) {
    const colors = {
        Open: 'bg-green-100 text-green-700 border-green-200',
        Filled: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        Closed: 'bg-red-100 text-red-600 border-red-200',
    };
    return (
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${colors[status] || ''}`}>
            {status}
        </span>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
                {icon} {label}
            </p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    );
}

export default function CompanyDashboard() {
    const navigate = useNavigate();
    const { company, token, logoutCompany } = useCompany();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [statusBusy, setStatusBusy] = useState('');

    useEffect(() => { if (!company) navigate('/company/login'); }, [company, navigate]);

    const fetchListings = useCallback(async () => {
        if (!company) return;
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/internships/company/${company._id}`);
            setListings(data.internships || []);
        } catch { setListings([]); }
        finally { setLoading(false); }
    }, [company]);

    useEffect(() => { fetchListings(); }, [fetchListings]);

    const changeStatus = async (id, newStatus) => {
        setStatusBusy(id);
        try {
            await axios.put(
                `${API}/internships/${id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setListings((prev) =>
                prev.map((l) => l._id === id ? { ...l, status: newStatus } : l)
            );
        } catch (err) {
            alert(err.response?.data?.message || 'Status update failed');
        } finally { setStatusBusy(''); }
    };

    if (!company) return null;

    const openCount = listings.filter((l) => l.status === 'Open').length;
    const totalSeats = listings.reduce((a, l) => a + (l.totalSeats || 0), 0);
    const filledSeats = listings.reduce((a, l) => a + (l.filledSeats || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Nav */}
            <nav className="bg-blue-800 text-white px-6 py-3 flex items-center justify-between shadow">
                <div className="flex items-center gap-3">
                    <span className="text-xl">🏢</span>
                    <div>
                        <p className="font-bold text-sm">{company.companyName}</p>
                        <p className="text-blue-300 text-xs">PM Internship Scheme · Company Portal</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {company.verified
                        ? <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">✓ Verified</span>
                        : <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full">⏳ Pending Verification</span>
                    }
                    <button
                        onClick={() => { logoutCompany(); navigate('/company/login'); }}
                        className="text-blue-300 hover:text-white text-sm"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 py-8">

                {/* Run Allocation */}
                <div className="mb-8">
                    <RunAllocation />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Company Dashboard</h1>
                        <p className="text-gray-400 text-sm mt-0.5">
                            {company.sector} · {company.location?.city}, {company.location?.state}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-lg text-sm shadow flex items-center gap-2"
                    >
                        <span className="text-lg">+</span> Post New Internship
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard icon="📋" label="Total Listings" value={listings.length} />
                    <StatCard icon="🟢" label="Open Listings" value={openCount} />
                    <StatCard icon="🪑" label="Total Seats" value={totalSeats} />
                    <StatCard icon="✅" label="Seats Filled" value={filledSeats} />
                </div>

                {/* Verification banner */}
                {!company.verified && (
                    <div className="bg-yellow-50 border border-yellow-300 rounded-xl px-5 py-4 mb-6 flex gap-3">
                        <span className="text-yellow-500 text-xl">⚠️</span>
                        <div>
                            <p className="font-semibold text-yellow-800 text-sm">Account Pending Verification</p>
                            <p className="text-yellow-700 text-xs mt-0.5">
                                MCA admin will verify your account. Listings will go live once verified.
                                You can still post internships now.
                            </p>
                        </div>
                    </div>
                )}

                {/* Listings table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-700">Your Internship Listings</h2>
                        <span className="text-xs text-gray-400">{listings.length} listing{listings.length !== 1 ? 's' : ''}</span>
                    </div>

                    {loading ? (
                        <div className="py-16 text-center text-gray-400">
                            <div className="inline-block w-8 h-8 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin mb-3" />
                            <p className="text-sm">Loading listings...</p>
                        </div>
                    ) : listings.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-4xl mb-3">📭</p>
                            <p className="text-gray-500 font-medium">No internships posted yet</p>
                            <p className="text-gray-400 text-sm mt-1">Click "Post New Internship" to get started</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                    <tr>
                                        {['Role', 'Sector', 'Location', 'Stipend', 'Seats Filled', 'Status', 'Actions'].map((h) => (
                                            <th key={h} className="text-left px-5 py-3 font-semibold tracking-wide">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {listings.map((l) => (
                                        <tr key={l._id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-gray-800">{l.title}</p>
                                                <p className="text-gray-400 text-xs mt-0.5">{l.duration}</p>
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">{l.sector}</td>
                                            <td className="px-5 py-4 text-gray-600">
                                                {l.location?.city}, {l.location?.state}
                                            </td>
                                            <td className="px-5 py-4 font-medium text-gray-800">
                                                ₹{l.stipend?.toLocaleString()}/mo
                                            </td>
                                            {/* Seat tracker */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1 text-sm">
                                                    <span className="font-semibold text-blue-700">{l.filledSeats}</span>
                                                    <span className="text-gray-400">/</span>
                                                    <span className="text-gray-600">{l.totalSeats}</span>
                                                </div>
                                                <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1">
                                                    <div
                                                        className="h-1.5 bg-blue-500 rounded-full"
                                                        style={{ width: `${Math.min((l.filledSeats / l.totalSeats) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={l.status} />
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    {l.status !== 'Closed' ? (
                                                        <button
                                                            onClick={() => changeStatus(l._id, 'Closed')}
                                                            disabled={statusBusy === l._id}
                                                            className="text-xs text-red-600 hover:underline disabled:opacity-50"
                                                        >
                                                            Close
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => changeStatus(l._id, 'Open')}
                                                            disabled={statusBusy === l._id}
                                                            className="text-xs text-green-600 hover:underline disabled:opacity-50"
                                                        >
                                                            Reopen
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => navigate(`/internships/${l._id}`)}
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Quota Dashboard */}
                <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <QuotaDashboard />
                </div>
            </div>

            {showModal && (
                <PostInternshipModal
                    onClose={() => setShowModal(false)}
                    onSuccess={fetchListings}
                />
            )}
        </div>
    );
}