// frontend/src/pages/InternshipDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function QuotaBar({ label, value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const colors = {
    General:'bg-blue-500', OBC:'bg-green-500', SC:'bg-purple-500',
    ST:'bg-orange-500', Rural:'bg-teal-500', Aspirational:'bg-yellow-500',
  };
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="font-medium">{label}</span>
        <span>{value} seats ({pct}%)</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full">
        <div className={`h-2 rounded-full ${colors[label] || 'bg-blue-400'}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function InternshipDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [item,    setItem]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    axios.get(`${API}/internships/${id}`)
      .then(({ data }) => setItem(data))
      .catch(() => setError('Internship not found or unavailable.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <div className="w-10 h-10 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );

  if (error || !item)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-4xl mb-3">😕</p>
          <p className="text-gray-600 font-medium">{error || 'Not found'}</p>
          <button onClick={() => navigate(-1)}
            className="mt-4 text-blue-600 hover:underline text-sm">← Go back</button>
        </div>
      </div>
    );

  const co       = item.companyId;
  const seatsLeft = item.totalSeats - item.filledSeats;
  const seatPct   = Math.min((item.filledSeats / item.totalSeats) * 100, 100);
  const qb        = item.quotaBreakdown || {};

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Back nav */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <button onClick={() => navigate(-1)}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          ← Back to listings
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">{item.title}</h1>
              <p className="text-gray-500 mt-1 flex items-center gap-1.5">
                🏢 <span className="font-medium text-gray-700">{co?.companyName}</span>
                {co?.verified && (
                  <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200">
                    ✓ Verified
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-700">₹{item.stipend?.toLocaleString()}</p>
              <p className="text-gray-400 text-xs">per month</p>
            </div>
          </div>

          {/* Quick meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
            {[
              { icon: '📍', label: 'Location', val: `${item.location?.city}, ${item.location?.state}` },
              { icon: '🏷️', label: 'Sector',   val: item.sector },
              { icon: '⏱',  label: 'Duration', val: item.duration },
              {
                icon: '📅', label: 'Deadline',
                val: item.applicationDeadline
                  ? new Date(item.applicationDeadline).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  : 'Rolling',
              },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-xs text-gray-400 mb-0.5">{m.icon} {m.label}</p>
                <p className="font-semibold text-gray-700 text-sm">{m.val}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="md:col-span-2 space-y-5">

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-700 mb-3">About the Internship</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>

            {/* Skills */}
            {item.skillsRequired?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="font-bold text-gray-700 mb-3">Skills Required</h2>
                <div className="flex flex-wrap gap-2">
                  {item.skillsRequired.map((s) => (
                    <span key={s}
                      className="bg-blue-50 text-blue-700 border border-blue-100 text-sm px-3 py-1 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* About company */}
            {co?.description && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="font-bold text-gray-700 mb-2">About {co.companyName}</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{co.description}</p>
                {co.website && (
                  <a href={co.website} target="_blank" rel="noreferrer"
                    className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                    🌐 {co.website}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">

            {/* Seat tracker */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-gray-700 mb-3 text-sm">Seat Availability</h3>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-blue-700 text-lg">{seatsLeft}</span>
                <span className="text-gray-400 text-xs self-end">/ {item.totalSeats} seats</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full mb-1">
                <div
                  className={`h-2 rounded-full ${
                    seatPct >= 100 ? 'bg-red-400' : seatPct > 70 ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${seatPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{Math.round(seatPct)}% filled</p>
            </div>

            {/* Quota breakdown */}
            {Object.values(qb).some((v) => v > 0) && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-bold text-gray-700 mb-4 text-sm">Quota Breakdown</h3>
                <div className="space-y-3">
                  {[
                    ['General',     qb.general],
                    ['OBC',         qb.obc],
                    ['SC',          qb.sc],
                    ['ST',          qb.st],
                    ['Rural',       qb.rural],
                    ['Aspirational',qb.aspirational],
                  ].filter(([, v]) => v > 0).map(([label, value]) => (
                    <QuotaBar key={label} label={label} value={value} total={item.totalSeats} />
                  ))}
                </div>
              </div>
            )}

            {/* Apply CTA */}
            <div className="bg-blue-700 rounded-2xl p-5 text-white text-center">
              {item.status === 'Open' ? (
                <>
                  <p className="font-bold mb-1">Ready to Apply?</p>
                  <p className="text-blue-200 text-xs mb-4">
                    Login as a candidate to apply for this internship
                  </p>
                  <Link to="/login"
                    className="block bg-white text-blue-700 font-semibold text-sm py-2.5 rounded-xl hover:bg-blue-50 transition-colors">
                    Login to Apply
                  </Link>
                  <Link to="/register"
                    className="block text-blue-300 hover:text-white text-xs mt-3">
                    New candidate? Register here
                  </Link>
                </>
              ) : (
                <p className="font-semibold text-blue-200">
                  This internship is currently{' '}
                  <strong className="text-white">{item.status}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}