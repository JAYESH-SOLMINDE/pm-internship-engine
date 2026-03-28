// frontend/src/components/dashboard/AllocationStatus.jsx
// Shows allocation result card on candidate dashboard

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5001/api';

// ─── Countdown Timer ──────────────────────────────────────────────────────────
const CountdownTimer = ({ deadline }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calc = () => {
            const diff = new Date(deadline) - new Date();
            if (diff <= 0) { setTimeLeft('Expired'); return; }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        };
        calc();
        const t = setInterval(calc, 60000);
        return () => clearInterval(t);
    }, [deadline]);

    return (
        <span className="font-mono text-sm font-bold text-orange-600">{timeLeft}</span>
    );
};

// ─── Allocated Card ───────────────────────────────────────────────────────────
const AllocatedCard = ({ allocation, onRespond }) => {
    const [loading, setLoading] = useState(false);
    const i = allocation.internshipId;

    const handleRespond = async (response) => {
        setLoading(true);
        try {
            await axios.put(`${API}/allocations/${allocation._id}/respond`, { response });
            onRespond();
        } catch (err) {
            alert(err.response?.data?.message || 'Error responding');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                    🎉
                </div>
                <div>
                    <h3 className="font-bold text-green-800 text-lg">You Have Been Allocated!</h3>
                    <p className="text-green-600 text-sm">Congratulations on your internship match</p>
                </div>
            </div>

            {/* Internship Details */}
            <div className="bg-white rounded-xl p-4 mb-4 border border-green-200">
                <h4 className="font-bold text-gray-800 text-base mb-1">
                    {i?.title || 'Internship'}
                </h4>
                <p className="text-sm text-gray-500 mb-3">
                    {i?.location?.city}, {i?.location?.state}
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-700">
                            ₹{i?.stipend?.toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-500">Monthly Stipend</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-700">
                            {Math.round(allocation.matchScore)}%
                        </div>
                        <div className="text-xs text-gray-500">Match Score</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="text-sm font-bold text-gray-700">{i?.duration}</div>
                        <div className="text-xs text-gray-500">Duration</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded-lg">
                        <div className="text-sm font-bold text-yellow-700 capitalize">
                            {allocation.quotaCategory}
                        </div>
                        <div className="text-xs text-gray-500">Quota Category</div>
                    </div>
                </div>
            </div>

            {/* Response deadline */}
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 mb-4">
                <span className="text-sm text-gray-600">Response deadline:</span>
                <CountdownTimer deadline={allocation.responseDeadline} />
            </div>

            {/* Accept / Reject buttons */}
            <div className="flex gap-3">
                <button
                    onClick={() => handleRespond('Accepted')}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                    ✅ Accept Offer
                </button>
                <button
                    onClick={() => handleRespond('Rejected')}
                    disabled={loading}
                    className="flex-1 bg-red-50 hover:bg-red-100 disabled:bg-red-50 text-red-600 border border-red-200 font-semibold py-3 rounded-xl transition-colors"
                >
                    ❌ Decline
                </button>
            </div>
        </div>
    );
};

// ─── Accepted Card ────────────────────────────────────────────────────────────
const AcceptedCard = ({ allocation }) => {
    const i = allocation.internshipId;
    return (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">✅</div>
                <div>
                    <h3 className="font-bold text-blue-800 text-lg">Offer Accepted</h3>
                    <p className="text-blue-600 text-sm">Your internship has been confirmed</p>
                </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-200">
                <h4 className="font-bold text-gray-800">{i?.title}</h4>
                <p className="text-sm text-gray-500">{i?.location?.city}, {i?.location?.state}</p>
                <p className="text-sm text-gray-500 mt-1">₹{i?.stipend?.toLocaleString('en-IN')}/month · {i?.duration}</p>
            </div>
        </div>
    );
};

// ─── Waitlisted Card ──────────────────────────────────────────────────────────
const WaitlistedCard = ({ allocation }) => {
    const i = allocation.internshipId;
    return (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">⏳</div>
                <div>
                    <h3 className="font-bold text-orange-800 text-lg">You Are on the Waitlist</h3>
                    <p className="text-orange-600 text-sm">
                        Position #{allocation.waitlistPosition || '—'} · You will be notified if a seat opens
                    </p>
                </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-orange-200">
                <h4 className="font-bold text-gray-800">{i?.title}</h4>
                <p className="text-sm text-gray-500">{i?.location?.city}, {i?.location?.state}</p>
                <p className="text-sm text-gray-500 mt-1">
                    Match Score: <span className="font-bold text-orange-600">{Math.round(allocation.matchScore)}%</span>
                </p>
            </div>
            <p className="text-xs text-gray-400 mt-3">
                If an allocated candidate declines, the next person on the waitlist is automatically offered the seat.
            </p>
        </div>
    );
};

// ─── No Allocation Card ───────────────────────────────────────────────────────
const NoAllocationCard = () => (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <h3 className="font-bold text-gray-700 text-lg mb-2">No Allocation Yet</h3>
        <p className="text-gray-500 text-sm">
            The allocation engine has not run yet or no matching internship was found for your profile.
            Make sure your profile is complete with skills and sector interests.
        </p>
    </div>
);

// ─── Main AllocationStatus ────────────────────────────────────────────────────
const AllocationStatus = ({ candidateId }) => {
    const [allocation, setAllocation] = useState(undefined);
    const [loading, setLoading] = useState(true);

    const fetchAllocation = async () => {
        try {
            const { data } = await axios.get(`${API}/allocations/candidate/${candidateId}`);
            setAllocation(data.allocation);
        } catch {
            setAllocation(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (candidateId) fetchAllocation();
    }, [candidateId]);

    if (loading) return (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
    );

    if (!allocation) return <NoAllocationCard />;

    if (allocation.status === 'Pending') return <AllocatedCard allocation={allocation} onRespond={fetchAllocation} />;
    if (allocation.status === 'Accepted') return <AcceptedCard allocation={allocation} />;
    if (allocation.status === 'Waitlisted') return <WaitlistedCard allocation={allocation} />;

    return <NoAllocationCard />;
};

export default AllocationStatus;