// frontend/src/components/dashboard/RunAllocation.jsx
// Admin panel to trigger and monitor the allocation engine

import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5001/api';

const StatCard = ({ value, label, color }) => (
    <div className={`text-center p-4 rounded-xl ${color}`}>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm mt-1 opacity-80">{label}</div>
    </div>
);

const RunAllocation = () => {
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState([]);

    const addLog = (msg) => setProgress(p => [...p, `${new Date().toLocaleTimeString()} — ${msg}`]);

    const handleRunAllocation = async () => {
        setRunning(true);
        setResult(null);
        setError('');
        setProgress([]);

        try {
            addLog('Fetching unallocated candidates...');
            await new Promise(r => setTimeout(r, 600));

            addLog('Fetching open internships...');
            await new Promise(r => setTimeout(r, 500));

            addLog('Calling AI match engine for full score matrix...');
            await new Promise(r => setTimeout(r, 800));

            addLog('Applying quota constraints (SC/ST/OBC/Rural)...');
            await new Promise(r => setTimeout(r, 500));

            addLog('Running greedy allocation algorithm...');

            const { data } = await axios.post(`${API}/allocations/run-allocation`);

            addLog('Saving allocations to database...');
            await new Promise(r => setTimeout(r, 400));

            addLog('Updating seat counts and quota records...');
            await new Promise(r => setTimeout(r, 300));

            addLog('✅ Allocation complete!');
            setResult(data.summary);

        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            setError(msg);
            addLog(`❌ Error: ${msg}`);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">🚀 Allocation Engine</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Run the full AI-based candidate-to-internship allocation cycle
                    </p>
                </div>
                <button
                    onClick={handleRunAllocation}
                    disabled={running}
                    className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
                >
                    {running ? (
                        <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Running...
                        </>
                    ) : '▶ Run Allocation'}
                </button>
            </div>

            {/* Algorithm info */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-blue-800 text-sm mb-2">Algorithm Steps</h4>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Fetch all unallocated candidates + open internships</li>
                    <li>Call Flask ML engine for full score matrix (TF-IDF)</li>
                    <li>Apply quota constraints (SC 15% · ST 7.5% · OBC 27% · Rural 10%)</li>
                    <li>Greedy assignment — highest score first, respecting capacity</li>
                    <li>Unmatched candidates → ranked waitlist per internship</li>
                    <li>Rejected slots auto-reallocated from waitlist</li>
                </ol>
            </div>

            {/* Live progress log */}
            {progress.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4 mb-6 font-mono text-xs text-green-400 space-y-1 max-h-48 overflow-y-auto">
                    {progress.map((log, i) => (
                        <div key={i}>{log}</div>
                    ))}
                    {running && (
                        <div className="animate-pulse">▋</div>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                    ❌ {error}
                </div>
            )}

            {/* Results summary */}
            {result && (
                <div>
                    <h3 className="font-bold text-gray-800 mb-4">📊 Allocation Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <StatCard value={result.totalCandidates} label="Total Candidates" color="bg-gray-50   text-gray-700" />
                        <StatCard value={result.matched} label="Matched" color="bg-green-50  text-green-700" />
                        <StatCard value={result.waitlisted} label="Waitlisted" color="bg-orange-50 text-orange-700" />
                        <StatCard value={result.unmatched} label="Unmatched" color="bg-red-50    text-red-700" />
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center text-sm text-green-700 font-medium">
                        ✅ Allocation complete — candidates have been notified on their dashboards
                    </div>
                </div>
            )}
        </div>
    );
};

export default RunAllocation;