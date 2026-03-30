// frontend/src/components/dashboard/BiasAudit.jsx
// Fairness audit panel for admin dashboard

import React, { useState } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

const API = 'http://localhost:5001/api/bias-audit';

const CATEGORY_COLORS = {
    General: '#3B82F6', OBC: '#F59E0B', SC: '#8B5CF6', ST: '#EF4444',
};
const DISTRICT_COLORS = {
    Urban: '#3B82F6', Rural: '#10B981', Aspirational: '#F97316',
};

const BiasAudit = ({ authHeaders }) => {
    const [audit, setAudit] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRun = async () => {
        setLoading(true); setError('');
        try {
            const { data } = await axios.get(`${API}/run`, authHeaders());
            setAudit(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Audit failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">⚖️ Fairness Audit</h2>
                    <p className="text-sm text-gray-500">Detect bias in match scores and allocation rates across social categories</p>
                </div>
                <button onClick={handleRun} disabled={loading}
                    className="bg-purple-700 hover:bg-purple-800 disabled:bg-purple-300 text-white font-semibold px-5 py-2.5 rounded-xl">
                    {loading ? '⏳ Running...' : '▶ Run Audit'}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            {!audit && !loading && (
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-10 text-center">
                    <div className="text-4xl mb-3">⚖️</div>
                    <p className="text-gray-500 text-sm">Click "Run Audit" to analyze fairness across social categories.</p>
                </div>
            )}

            {audit && (
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                            <div className="text-3xl font-bold text-blue-700">{audit.overallAvgScore}%</div>
                            <div className="text-sm text-gray-500 mt-1">Overall Avg Score</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
                            <div className="text-3xl font-bold text-gray-700">{audit.totalAllocations}</div>
                            <div className="text-sm text-gray-500 mt-1">Total Allocations</div>
                        </div>
                        <div className={`rounded-2xl p-4 text-center border ${audit.flagCount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                            <div className={`text-3xl font-bold ${audit.flagCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {audit.flagCount > 0 ? `${audit.flagCount} ⚠️` : '0 ✅'}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">Bias Flags</div>
                        </div>
                    </div>

                    {/* Warnings */}
                    {[...audit.categoryAudit, ...audit.districtAudit]
                        .filter(x => x.flagged)
                        .map((item, i) => (
                            <div key={i} className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                                {item.warning}
                            </div>
                        ))
                    }

                    {/* Category score chart */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4">Avg Match Score by Social Category</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={audit.categoryAudit.map(d => ({
                                name: d.category, score: d.avgScore, count: d.count,
                            }))}>
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(v) => [`${v}%`, 'Avg Score']} />
                                <ReferenceLine y={audit.overallAvgScore} stroke="#3B82F6" strokeDasharray="4 2" label={{ value: 'Overall', position: 'right', fontSize: 11 }} />
                                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                                    {audit.categoryAudit.map((d, i) => (
                                        <Cell key={i} fill={d.flagged ? '#EF4444' : (CATEGORY_COLORS[d.category] || '#3B82F6')} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* District score chart */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4">Avg Match Score by District Type</h3>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={audit.districtAudit.map(d => ({
                                name: d.district, score: d.avgScore,
                            }))}>
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(v) => [`${v}%`, 'Avg Score']} />
                                <ReferenceLine y={audit.overallAvgScore} stroke="#3B82F6" strokeDasharray="4 2" />
                                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                                    {audit.districtAudit.map((d, i) => (
                                        <Cell key={i} fill={d.flagged ? '#EF4444' : (DISTRICT_COLORS[d.district] || '#10B981')} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Allocation rate table */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800">Allocation Rate by Category</h3>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Category', 'Total Candidates', 'Allocated', 'Rate'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {audit.allocationRateAudit.map(row => (
                                    <tr key={row.category} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{row.category}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.total}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.allocated}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-gray-100 rounded-full">
                                                    <div className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${row.allocationRate}%` }} />
                                                </div>
                                                <span className="font-bold text-gray-700">{row.allocationRate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BiasAudit;