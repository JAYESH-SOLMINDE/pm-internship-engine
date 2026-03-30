// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import axios from 'axios';
import BiasAudit from '../components/dashboard/BiasAudit';
import {
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const API = 'http://localhost:5001/api/admin';

// ─── Colors ───────────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
    General: '#3B82F6', OBC: '#F59E0B', SC: '#8B5CF6', ST: '#EF4444',
    general: '#3B82F6', obc: '#F59E0B', sc: '#8B5CF6', st: '#EF4444',
    rural: '#10B981', aspirational: '#6366F1',
};
const SECTOR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
    <div className={`rounded-2xl p-5 ${color} border`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium opacity-70">{label}</p>
                <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
            </div>
            <span className="text-2xl">{icon}</span>
        </div>
    </div>
);

// ─── Quota Bar ────────────────────────────────────────────────────────────────
const QuotaBar = ({ label, data, minPct, color }) => {
    const pct = data?.pct || 0;
    const atRisk = pct < minPct * 50;
    const onTrack = pct >= minPct * 100;
    const barColor = onTrack ? 'bg-green-500' : atRisk ? 'bg-red-500' : 'bg-yellow-500';
    const badge = onTrack ? 'bg-green-100 text-green-700' : atRisk ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{label}</span>
                <span className="text-xs text-gray-500">{data?.allocated || 0}/{data?.capacity || 0} · {pct}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Target: min {minPct}%</p>
        </div>
    );
};

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
const AdminDashboard = () => {
    const { admin, logoutAdmin, authHeaders } = useAdmin();
    const navigate = useNavigate();
    const [tab, setTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [quota, setQuota] = useState(null);
    const [charts, setCharts] = useState(null);
    const [allocs, setAllocs] = useState([]);
    const [interns, setInterns] = useState([]);
    const [allocTotal, setAllocTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ status: '', category: '', sector: '' });
    const [running, setRunning] = useState(false);
    const [allocResult, setAllocResult] = useState(null);

    const headers = authHeaders();

    const fetchStats = useCallback(async () => {
        const { data } = await axios.get(`${API}/stats`, headers);
        setStats(data);
    }, []);

    const fetchQuota = useCallback(async () => {
        const { data } = await axios.get(`${API}/quota-summary`, headers);
        setQuota(data.quotaSummary);
    }, []);

    const fetchCharts = useCallback(async () => {
        const { data } = await axios.get(`${API}/category-report`, headers);
        setCharts(data);
    }, []);

    const fetchAllocations = useCallback(async () => {
        const params = new URLSearchParams({ page, limit: 15, ...filters });
        const { data } = await axios.get(`${API}/allocations?${params}`, headers);
        setAllocs(data.allocations || []);
        setAllocTotal(data.total || 0);
    }, [page, filters]);

    const fetchInternships = useCallback(async () => {
        const { data } = await axios.get(`${API}/internship-capacity`, headers);
        setInterns(data.internships || []);
    }, []);

    useEffect(() => {
        if (!admin) { navigate('/admin/login'); return; }
        fetchStats();
        fetchQuota();
        fetchCharts();
    }, [admin]);

    useEffect(() => { if (tab === 'allocations') fetchAllocations(); }, [tab, page, filters]);
    useEffect(() => { if (tab === 'capacity') fetchInternships(); }, [tab]);

    const handleRunAllocation = async () => {
        setRunning(true);
        try {
            const { data } = await axios.post('http://localhost:5001/api/allocations/run-allocation');
            setAllocResult(data.summary);
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.message || 'Allocation failed');
        } finally {
            setRunning(false);
        }
    };

    const handleForceClose = async (id) => {
        if (!window.confirm('Force close this internship?')) return;
        await axios.put(`${API}/internships/${id}/force-close`, {}, headers);
        fetchInternships();
    };

    const handleExportCSV = () => {
        window.open(`${API}/export-csv?token=${authHeaders().headers.Authorization.split(' ')[1]}`);
    };

    const TABS = ['overview', 'allocations', 'quota', 'charts', 'capacity', 'fairness'];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Top Nav ── */}
            <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">MCA</div>
                    <div>
                        <div className="font-bold text-sm">PM Internship — Admin Panel</div>
                        <div className="text-xs text-gray-400">{admin?.name}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExportCSV} className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg">
                        ⬇ Export CSV
                    </button>
                    <button onClick={() => { logoutAdmin(); navigate('/admin/login'); }}
                        className="text-xs bg-red-700 hover:bg-red-800 px-3 py-1.5 rounded-lg">
                        Logout
                    </button>
                </div>
            </div>

            {/* ── Tab Bar ── */}
            <div className="bg-white border-b border-gray-200 px-6">
                <div className="flex gap-6">
                    {TABS.map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`py-3 text-sm font-medium border-b-2 capitalize transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}>
                            {t === 'overview' ? '📊 Overview' : t === 'allocations' ? '📋 Allocations' :
                                t === 'quota' ? '⚖️ Quota' : t === 'charts' ? '📈 Charts' : 
                                t === 'capacity' ? '🏢 Capacity' : '⚖️ Fairness'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* ── OVERVIEW TAB ── */}
                {tab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            <StatCard label="Candidates" value={stats?.totalCandidates} color="bg-blue-50   text-blue-800   border-blue-200" icon="👥" />
                            <StatCard label="Internships" value={stats?.totalInternships} color="bg-purple-50 text-purple-800 border-purple-200" icon="💼" />
                            <StatCard label="Companies" value={stats?.totalCompanies} color="bg-indigo-50 text-indigo-800 border-indigo-200" icon="🏢" />
                            <StatCard label="Allocated" value={stats?.totalAllocated} color="bg-green-50  text-green-800  border-green-200" icon="✅" />
                            <StatCard label="Waitlisted" value={stats?.totalWaitlisted} color="bg-yellow-50 text-yellow-800 border-yellow-200" icon="⏳" />
                            <StatCard label="Unmatched" value={stats?.unmatched} color="bg-red-50    text-red-800    border-red-200" icon="❌" />
                            <StatCard label="Accept Rate" value={`${stats?.acceptanceRate || 0}%`} color="bg-teal-50 text-teal-800 border-teal-200" icon="📈" />
                        </div>

                        {/* Run Allocation */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="font-bold text-gray-800 text-lg">🚀 Allocation Engine</h2>
                                    <p className="text-sm text-gray-500">Trigger the full AI-based candidate-to-internship allocation</p>
                                </div>
                                <button onClick={handleRunAllocation} disabled={running}
                                    className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold px-6 py-3 rounded-xl">
                                    {running ? '⏳ Running...' : '▶ Run Allocation'}
                                </button>
                            </div>
                            {allocResult && (
                                <div className="grid grid-cols-4 gap-3 mt-4">
                                    <StatCard label="Candidates" value={allocResult.totalCandidates} color="bg-gray-50 text-gray-700 border-gray-200" icon="👥" />
                                    <StatCard label="Matched" value={allocResult.matched} color="bg-green-50 text-green-700 border-green-200" icon="✅" />
                                    <StatCard label="Waitlisted" value={allocResult.waitlisted} color="bg-yellow-50 text-yellow-700 border-yellow-200" icon="⏳" />
                                    <StatCard label="Unmatched" value={allocResult.unmatched} color="bg-red-50 text-red-700 border-red-200" icon="❌" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── ALLOCATIONS TAB ── */}
                {tab === 'allocations' && (
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200 flex flex-wrap gap-3">
                            {[
                                { key: 'status', options: ['', 'Pending', 'Accepted', 'Rejected', 'Waitlisted'], label: 'Status' },
                                { key: 'category', options: ['', 'general', 'obc', 'sc', 'st', 'rural', 'aspirational'], label: 'Category' },
                                { key: 'sector', options: ['', 'Technology', 'Finance', 'Healthcare', 'Agriculture', 'Infrastructure'], label: 'Sector' },
                            ].map(({ key, options, label }) => (
                                <select key={key} value={filters[key]}
                                    onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none">
                                    {options.map(o => <option key={o} value={o}>{o || `All ${label}s`}</option>)}
                                </select>
                            ))}
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        {['Candidate', 'Internship', 'Sector', 'Score', 'Category', 'Status', 'Action'].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {allocs.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-8 text-gray-400">No allocations found</td></tr>
                                    ) : allocs.map(a => (
                                        <tr key={a._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-800">{a.candidateId?.fullName}</div>
                                                <div className="text-xs text-gray-400">{a.candidateId?.email}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{a.internshipId?.title}</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                                    {a.internshipId?.sector}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-gray-700">{Math.round(a.matchScore)}%</td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full"
                                                    style={{ background: CATEGORY_COLORS[a.quotaCategory] + '20', color: CATEGORY_COLORS[a.quotaCategory] }}>
                                                    {a.quotaCategory}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${a.status === 'Accepted' ? 'bg-green-100  text-green-700' :
                                                        a.status === 'Rejected' ? 'bg-red-100    text-red-700' :
                                                            a.status === 'Waitlisted' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-blue-100 text-blue-700'
                                                    }`}>{a.status}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button className="text-xs text-blue-600 hover:underline">Override</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Pagination */}
                            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100">
                                <span className="text-xs text-gray-500">Total: {allocTotal}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                        className="text-xs px-3 py-1 border rounded-lg disabled:opacity-40">Prev</button>
                                    <span className="text-xs px-3 py-1">Page {page}</span>
                                    <button onClick={() => setPage(p => p + 1)} disabled={allocs.length < 15}
                                        className="text-xs px-3 py-1 border rounded-lg disabled:opacity-40">Next</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── QUOTA TAB ── */}
                {tab === 'quota' && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm max-w-2xl">
                        <h2 className="font-bold text-gray-800 text-lg mb-6">⚖️ Quota Fulfillment</h2>
                        {quota ? (
                            <div>
                                <QuotaBar label="SC" data={quota.sc} minPct={15} color="bg-purple-500" />
                                <QuotaBar label="ST" data={quota.st} minPct={7.5} color="bg-red-500" />
                                <QuotaBar label="OBC" data={quota.obc} minPct={27} color="bg-yellow-500" />
                                <QuotaBar label="General" data={quota.general} minPct={0} color="bg-blue-500" />
                                <QuotaBar label="Rural" data={quota.rural} minPct={10} color="bg-green-500" />
                                <QuotaBar label="Aspirational" data={quota.aspirational} minPct={5} color="bg-indigo-500" />
                            </div>
                        ) : <p className="text-gray-400">Loading quota data...</p>}
                    </div>
                )}

                {/* ── CHARTS TAB ── */}
                {tab === 'charts' && charts && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Bar chart: by category */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-4">Allocations by Social Category</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={charts.byCategory.map(d => ({ name: d._id, count: d.count }))}>
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {charts.byCategory.map((d, i) => (
                                            <Cell key={i} fill={CATEGORY_COLORS[d._id] || '#3B82F6'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pie chart: by sector */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-4">Sector-wise Distribution</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={charts.bySector.map(d => ({ name: d._id, value: d.count }))}
                                        cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                        {charts.bySector.map((_, i) => (
                                            <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Line chart: allocations over time */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm lg:col-span-2">
                            <h3 className="font-bold text-gray-800 mb-4">Allocations Over Time</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={charts.byDate.map(d => ({ date: d._id, count: d.count }))}>
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* State-wise table */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm lg:col-span-2">
                            <h3 className="font-bold text-gray-800 mb-4">State-wise Intern Placement</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {charts.byState.map(s => (
                                    <div key={s._id} className="bg-blue-50 rounded-xl p-3 text-center">
                                        <div className="font-bold text-blue-700 text-lg">{s.count}</div>
                                        <div className="text-xs text-gray-500">{s._id}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── CAPACITY TAB ── */}
                {tab === 'capacity' && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="font-bold text-gray-800">🏢 Internship Capacity Monitor</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {['Internship', 'Company', 'Sector', 'Seats Filled', 'Progress', 'Status', 'Action'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {interns.map(i => {
                                    const pct = Math.round((i.filledSeats / i.totalSeats) * 100);
                                    return (
                                        <tr key={i._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-800">{i.title}</td>
                                            <td className="px-4 py-3 text-gray-600">{i.companyId?.companyName || '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{i.sector}</span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{i.filledSeats}/{i.totalSeats}</td>
                                            <td className="px-4 py-3 w-32">
                                                <div className="h-2 bg-gray-100 rounded-full">
                                                    <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                        style={{ width: `${Math.min(pct, 100)}%` }} />
                                                </div>
                                                <span className="text-xs text-gray-400">{pct}%</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${i.status === 'Open' ? 'bg-green-100 text-green-700' :
                                                        i.status === 'Filled' ? 'bg-blue-100  text-blue-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>{i.status}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {i.status !== 'Closed' && (
                                                    <button onClick={() => handleForceClose(i._id)}
                                                        className="text-xs text-red-600 hover:underline">Force Close</button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── FAIRNESS TAB ── */}
                {tab === 'fairness' && <BiasAudit authHeaders={authHeaders} />}

            </div>
        </div>
    );
};

export default AdminDashboard;