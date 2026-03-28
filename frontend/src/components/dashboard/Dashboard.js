/**
 * frontend/src/components/dashboard/Dashboard.js
 * Step 07 — Full Candidate Dashboard
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMatch } from '../../context/MatchContext';
import axios from 'axios';
import {
  FiUser, FiEdit2, FiCheckCircle, FiClock, FiMapPin,
  FiBriefcase, FiBook, FiTag, FiUploadCloud, FiBarChart2,
  FiAlertCircle, FiStar, FiAward, FiBell, FiFileText,
} from 'react-icons/fi';
import EditProfileModal from './EditProfileModal';
import AllocationStatus from './AllocationStatus';
import MatchResults from './MatchResults';

const API = 'http://localhost:5001/api';

// ─── Completion Ring ──────────────────────────────────────────────────────────
const CompletionRing = ({ pct }) => {
  const r = 36, circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#3b82f6' : '#f97316';
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="text-center">
        <div className="text-lg font-bold text-gray-800">{pct}%</div>
        <div className="text-xs text-gray-400">Profile</div>
      </div>
    </div>
  );
};

// ─── Category Badge ───────────────────────────────────────────────────────────
const CategoryBadge = ({ label, color }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>{label}</span>
);

const CATEGORY_COLORS = {
  SC: 'bg-purple-100 text-purple-700 border-purple-200',
  ST: 'bg-red-100    text-red-700    border-red-200',
  OBC: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  General: 'bg-gray-100   text-gray-700   border-gray-200',
};
const DISTRICT_COLORS = {
  Urban: 'bg-blue-100   text-blue-700   border-blue-200',
  Rural: 'bg-green-100  text-green-700  border-green-200',
  Aspirational: 'bg-orange-100 text-orange-700 border-orange-200',
};

// ─── Application Timeline ─────────────────────────────────────────────────────
const Timeline = ({ status }) => {
  const steps = [
    { key: 'registered', label: 'Registered' },
    { key: 'matched', label: 'Matched' },
    { key: 'allocated', label: 'Allocated' },
    { key: 'accepted', label: 'Accepted' },
  ];

  const activeIdx = status === 'Accepted' || status === 'Rejected' ? 3
    : status === 'Pending' ? 2
      : status === 'Waitlisted' ? 2
        : status === 'matched' ? 1
          : 0;

  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, i) => {
        const done = i < activeIdx;
        const current = i === activeIdx;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2
                ${done ? 'bg-green-500  border-green-500  text-white' :
                  current ? 'bg-blue-600   border-blue-600   text-white' :
                    'bg-gray-100  border-gray-200   text-gray-400'}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium ${current ? 'text-blue-700' : done ? 'text-green-600' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < activeIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Profile Completeness Checklist ──────────────────────────────────────────
const CompletenessChecklist = ({ profile }) => {
  const checks = [
    {
      label: 'Basic Info',
      done: !!(profile?.fullName && profile?.email && profile?.phone),
      impact: 'Required for registration',
    },
    {
      label: 'Education Details',
      done: !!(profile?.education?.degree && profile?.education?.college),
      impact: 'Affects qualification score (+15%)',
    },
    {
      label: 'Skills Added',
      done: (profile?.skills?.length || 0) >= 3,
      impact: 'Most important factor in matching (+35%)',
    },
    {
      label: 'Sector Interests',
      done: (profile?.sectorInterest?.length || 0) >= 1,
      impact: 'Affects sector match score (+20%)',
    },
    {
      label: 'Location Preference',
      done: !!(profile?.locationPreference?.state),
      impact: 'Affects location score (+20%)',
    },
    {
      label: 'Resume Uploaded',
      done: !!(profile?.resumeUrl),
      impact: 'Auto-extracts skills for better matching',
    },
  ];

  const completedCount = checks.filter(c => c.done).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <FiCheckCircle size={16} className="text-blue-600" /> Profile Checklist
        </h3>
        <span className="text-xs text-gray-500">{completedCount}/{checks.length} complete</span>
      </div>
      <div className="space-y-3">
        {checks.map(({ label, done, impact }) => (
          <div key={label} className={`flex items-start gap-3 p-2.5 rounded-xl ${done ? 'bg-green-50' : 'bg-orange-50'}`}>
            <div className={`mt-0.5 text-lg ${done ? 'text-green-500' : 'text-orange-400'}`}>
              {done ? '✅' : '⬜'}
            </div>
            <div>
              <div className={`text-sm font-medium ${done ? 'text-green-800' : 'text-orange-800'}`}>{label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{impact}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Notifications Panel ──────────────────────────────────────────────────────
const NotificationsPanel = ({ allocation, matchCount }) => {
  const notifications = [];

  if (allocation?.status === 'Pending') {
    const deadline = new Date(allocation.responseDeadline);
    const hoursLeft = Math.round((deadline - new Date()) / (1000 * 60 * 60));
    notifications.push({
      icon: '🎉',
      title: 'Allocation result is out!',
      body: 'You have been matched to an internship. Check your allocation card.',
      color: 'bg-green-50 border-green-200',
      time: 'Just now',
    });
    if (hoursLeft < 48) {
      notifications.push({
        icon: '⏰',
        title: `Your offer expires in ${hoursLeft}h`,
        body: 'Please accept or reject your internship offer before the deadline.',
        color: 'bg-orange-50 border-orange-200',
        time: `${hoursLeft}h remaining`,
      });
    }
  }

  if (matchCount > 0) {
    notifications.push({
      icon: '🔍',
      title: `${matchCount} internships match your profile`,
      body: 'New internship matches found based on your skills and preferences.',
      color: 'bg-blue-50 border-blue-200',
      time: 'Today',
    });
  }

  notifications.push({
    icon: '📋',
    title: 'Keep your profile updated',
    body: 'Profiles with resumes uploaded get 40% better match scores.',
    color: 'bg-gray-50 border-gray-200',
    time: 'Tip',
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
        <FiBell size={16} className="text-blue-600" /> Notifications
        {notifications.length > 0 && (
          <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </h3>
      <div className="space-y-3">
        {notifications.map((n, i) => (
          <div key={i} className={`flex gap-3 p-3 rounded-xl border ${n.color}`}>
            <span className="text-xl flex-shrink-0">{n.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-800">{n.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">{n.body}</div>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── My Applications Tab ──────────────────────────────────────────────────────
const MyApplications = ({ candidateId }) => {
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/allocations/candidate/${candidateId}`)
      .then(r => setAllocation(r.data.allocation))
      .catch(() => setAllocation(null))
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (loading) return <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>;

  if (!allocation) return (
    <div className="text-center py-10">
      <div className="text-4xl mb-3">📭</div>
      <p className="text-gray-500 text-sm">No applications yet. Use AI matching to find internships.</p>
    </div>
  );

  const i = allocation.internshipId;
  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-semibold text-gray-800">{i?.title}</h4>
            <p className="text-xs text-gray-500">{i?.location?.city}, {i?.location?.state}</p>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${allocation.status === 'Accepted' ? 'bg-green-100  text-green-700' :
              allocation.status === 'Rejected' ? 'bg-red-100    text-red-700' :
                allocation.status === 'Waitlisted' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
            }`}>{allocation.status}</span>
        </div>
        <div className="flex gap-3 text-xs text-gray-500">
          <span>₹{i?.stipend?.toLocaleString('en-IN')}/mo</span>
          <span>·</span>
          <span>{i?.duration}</span>
          <span>·</span>
          <span>Score: <b>{Math.round(allocation.matchScore)}%</b></span>
          <span>·</span>
          <span className="capitalize">{allocation.quotaCategory} quota</span>
        </div>
        <p className="text-xs text-gray-400 mt-2 italic">{allocation.allocationReason}</p>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const { candidate: authCandidate, updateCandidate } = useAuth();
  const { matches } = useMatch();

  const [profile, setProfile] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, allocRes] = await Promise.all([
          axios.get(`${API}/candidates/profile/${authCandidate.id}`),
          axios.get(`${API}/allocations/candidate/${authCandidate.id}`).catch(() => ({ data: { allocation: null } })),
        ]);
        if (profileRes.data.success) setProfile(profileRes.data.candidate);
        setAllocation(allocRes.data.allocation);
      } catch (err) {
        console.error(err);
        setProfile(authCandidate);
      } finally {
        setLoading(false);
      }
    };
    if (authCandidate?.id) fetchAll();
    else setLoading(false);
  }, [authCandidate]);

  const handleProfileUpdate = (updated) => {
    setProfile(updated);
    updateCandidate({ fullName: updated.fullName, completionPercentage: updated.completionPercentage });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="text-blue-700 font-medium">Loading your dashboard...</div>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-red-500">Failed to load profile. Please refresh.</div>
    </div>
  );

  const pct = profile.completionPercentage ?? 0;
  const allSkills = [...new Set([...(profile.skills || []), ...(profile.parsedSkills || [])])];
  const TABS = ['status', 'matches', 'applications'];

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Profile Header ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar + Ring */}
            <div className="relative">
              <CompletionRing pct={pct} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {profile.fullName?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
                <CategoryBadge label={profile.socialCategory} color={CATEGORY_COLORS[profile.socialCategory] || CATEGORY_COLORS.General} />
                <CategoryBadge label={profile.districtType} color={DISTRICT_COLORS[profile.districtType] || DISTRICT_COLORS.Urban} />
              </div>
              <p className="text-gray-500 text-sm mb-2">{profile.email} · {profile.phone}</p>
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                {profile.education?.degree && <span className="flex items-center gap-1"><FiBook size={11} /> {profile.education.degree}</span>}
                {profile.education?.college && <span className="flex items-center gap-1"><FiBook size={11} /> {profile.education.college}</span>}
                {profile.locationPreference?.city && <span className="flex items-center gap-1"><FiMapPin size={11} /> {profile.locationPreference.city}, {profile.locationPreference.state}</span>}
              </div>
            </div>

            {/* Edit button */}
            <button onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
              <FiEdit2 size={14} /> Edit Profile
            </button>
          </div>

          {/* Skills strip */}
          {allSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              {allSkills.slice(0, 8).map(s => (
                <span key={s} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-full font-medium">{s}</span>
              ))}
              {allSkills.length > 8 && (
                <span className="text-xs text-gray-400 py-1">+{allSkills.length - 8} more</span>
              )}
            </div>
          )}
        </div>

        {/* ── Tab Bar ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 flex overflow-x-auto">
          {[
            { key: 'status', label: '📋 Application Status' },
            { key: 'matches', label: '🤖 AI Matches' },
            { key: 'applications', label: '📁 My Applications' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === t.key
                  ? 'border-blue-600 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Main Content ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* APPLICATION STATUS TAB */}
            {activeTab === 'status' && (
              <div className="space-y-5">
                {/* Timeline */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-5">Application Timeline</h3>
                  <Timeline status={allocation?.status} />
                </div>

                {/* Allocation card */}
                <AllocationStatus candidateId={profile?._id || authCandidate?.id} />
              </div>
            )}

            {/* MATCHES TAB */}
            {activeTab === 'matches' && (
              <MatchResults candidateId={profile?._id || authCandidate?.id} completionPct={pct} />
            )}

            {/* APPLICATIONS TAB */}
            {activeTab === 'applications' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiFileText size={16} className="text-blue-600" /> My Applications
                </h3>
                <MyApplications candidateId={profile?._id || authCandidate?.id} />
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-5">
            {/* Notifications */}
            <NotificationsPanel allocation={allocation} matchCount={matches?.length || 0} />

            {/* Checklist */}
            <CompletenessChecklist profile={profile} />

            {/* Sector Interests */}
            {(profile.sectorInterest || []).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <FiBriefcase size={15} className="text-blue-600" /> Sector Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.sectorInterest.map(s => (
                    <span key={s} className="px-3 py-1.5 bg-blue-700 text-white rounded-full text-xs font-semibold">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume status */}
            <div className={`rounded-2xl border p-4 ${profile.resumeUrl ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className={`flex items-center gap-2 font-semibold text-sm mb-1 ${profile.resumeUrl ? 'text-green-700' : 'text-orange-700'}`}>
                <FiUploadCloud size={15} />
                {profile.resumeUrl ? 'Resume Uploaded ✓' : 'Resume Not Uploaded'}
              </div>
              <p className={`text-xs ${profile.resumeUrl ? 'text-green-600' : 'text-orange-600'}`}>
                {profile.resumeUrl
                  ? 'Your resume has been parsed for skills.'
                  : 'Upload your resume to auto-extract skills and improve match score.'}
              </p>
              {!profile.resumeUrl && (
                <button onClick={() => setEditOpen(true)}
                  className="mt-2 text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700">
                  Upload Resume
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSave={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default Dashboard;