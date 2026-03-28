// frontend/src/components/dashboard/MatchResults.jsx
import React, { useState } from 'react';
import { useMatch } from '../../context/MatchContext';
import { FiBarChart2, FiAlertCircle, FiClock, FiStar } from 'react-icons/fi';

// ─── Score Bar ────────────────────────────────────────────────────────────────
const ScoreBar = ({ label, value, color }) => (
  <div className="mb-1">
    <div className="flex justify-between text-xs text-gray-500 mb-0.5">
      <span>{label}</span>
      <span className="font-medium">{value}%</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  </div>
);

// ─── Match Badge ──────────────────────────────────────────────────────────────
const MatchBadge = ({ score }) => {
  let bg = 'bg-red-100 text-red-700';
  if (score >= 70) bg = 'bg-green-100 text-green-700';
  else if (score >= 40) bg = 'bg-yellow-100 text-yellow-700';
  return <span className={`text-xs font-bold px-2 py-1 rounded-full ${bg}`}>{score}% Match</span>;
};

// ─── Match Card ───────────────────────────────────────────────────────────────
const MatchCard = ({ match }) => {
  const [expanded, setExpanded] = useState(false);
  const { internship, matchScore, breakdown } = match;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">{internship.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Company &bull; {internship.location?.city}, {internship.location?.state}
          </p>
        </div>
        <MatchBadge score={matchScore} />
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{internship.sector}</span>
        <span className="bg-gray-50 text-gray-600 text-xs px-2 py-0.5 rounded-full">₹{internship.stipend?.toLocaleString('en-IN')}/mo</span>
        <span className="bg-gray-50 text-gray-600 text-xs px-2 py-0.5 rounded-full">{internship.duration}</span>
        <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">{internship.totalSeats - (internship.filledSeats || 0)} seats left</span>
      </div>
      <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 hover:underline mb-2">
        {expanded ? '▲ Hide breakdown' : '▼ View score breakdown'}
      </button>
      {expanded && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <ScoreBar label="Skills Match"   value={breakdown.skills}        color="bg-blue-500"   />
          <ScoreBar label="Sector Match"   value={breakdown.sector}        color="bg-purple-500" />
          <ScoreBar label="Location Match" value={breakdown.location}      color="bg-green-500"  />
          <ScoreBar label="Qualification"  value={breakdown.qualification} color="bg-yellow-500" />
          <ScoreBar label="Category Bonus" value={breakdown.categoryBonus} color="bg-pink-500"   />
        </div>
      )}
      <button className="w-full mt-1 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium py-2 rounded-lg transition-colors">
        Apply Now
      </button>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const MatchResults = ({ candidateId, completionPct = 0 }) => {
  const { matches, loading, error, fetchMatches } = useMatch();
  const [fetched, setFetched] = useState(false);

  const handleFetch = async () => {
    await fetchMatches(candidateId);
    setFetched(true);
  };

  // ── Not yet clicked — show original placeholder UI ──
  if (!fetched && !loading) {
    return (
      <div className="card text-center py-10">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FiBarChart2 size={28} className="text-blue-400" />
        </div>
        <h3 className="font-bold text-blue-900 text-lg mb-2">Your Match Results Will Appear Here</h3>
        <p className="text-gray-500 text-sm mb-5 max-w-sm mx-auto">
          {completionPct < 60
            ? 'Complete at least 60% of your profile to unlock AI-based internship matching.'
            : 'Click below to find your best-matching internships using our AI engine.'
          }
        </p>
        {completionPct < 60 ? (
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-2 rounded-lg">
            <FiAlertCircle size={14} />
            Profile {completionPct}% complete — need 60% minimum
          </div>
        ) : (
          <button
            onClick={handleFetch}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            🔍 Find Matching Internships
          </button>
        )}
      </div>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="card text-center py-10">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="animate-spin h-7 w-7 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
        <p className="text-blue-700 font-medium">Finding your best matches...</p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="card text-center py-10">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          {error} — Make sure the ML service is running on port 5002.
        </div>
        <button onClick={handleFetch} className="bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  // ── Results ──
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-blue-900 text-lg">Your Match Results</h3>
          <p className="text-xs text-gray-500">Powered by TF-IDF cosine similarity engine · {matches.length} matches found</p>
        </div>
        <button onClick={handleFetch} className="text-xs text-blue-600 hover:underline">Refresh</button>
      </div>
      {matches.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">
          No matches found. Try updating your skills and sector interests.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match, i) => <MatchCard key={i} match={match} />)}
        </div>
      )}
    </div>
  );
};

export default MatchResults;