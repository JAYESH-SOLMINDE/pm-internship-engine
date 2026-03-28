/**
 * Dashboard — PM Internship Scheme
 * components/dashboard/Dashboard.js
 *
 * Shows:
 * - Profile completion % bar
 * - Category & district info
 * - Skill tags
 * - Match results placeholder
 * - Edit profile button
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  FiUser, FiEdit2, FiCheckCircle, FiClock, FiMapPin,
  FiBriefcase, FiBook, FiTag, FiUploadCloud, FiBarChart2,
  FiAlertCircle, FiStar, FiAward, FiInfo
} from 'react-icons/fi';
import EditProfileModal from './EditProfileModal';
import MatchResults from './MatchResults';

// ─── Profile Completion Bar ───────────────────────────────────────────────────
const CompletionBar = ({ percentage }) => {
  const color = percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-blue-600' : 'bg-orange-500';
  const label = percentage >= 80 ? 'Excellent' : percentage >= 50 ? 'Good' : 'Incomplete';

  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-semibold text-gray-700">Profile Completion</span>
        <span className={`text-sm font-bold ${percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-blue-600' : 'text-orange-500'}`}>
          {percentage}% — {label}
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {percentage < 80 && (
        <p className="text-xs text-gray-500 mt-1">
          Complete your profile to improve your internship match score.
        </p>
      )}
    </div>
  );
};

// ─── Info Card ────────────────────────────────────────────────────────────────
const InfoCard = ({ icon: Icon, label, value, accent = false }) => (
  <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${accent ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
    <div className={`mt-0.5 ${accent ? 'text-blue-600' : 'text-gray-500'}`}>
      <Icon size={16} />
    </div>
    <div>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      <div className={`text-sm font-semibold mt-0.5 ${accent ? 'text-blue-800' : 'text-gray-800'}`}>
        {value || '—'}
      </div>
    </div>
  </div>
);

// ─── Skill Badge ──────────────────────────────────────────────────────────────
const SkillBadge = ({ skill, parsed = false }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border
    ${parsed
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
    {parsed && <FiStar size={10} />}
    {skill}
  </span>
);

// ─── Category Badge ───────────────────────────────────────────────────────────
const CategoryBadge = ({ category }) => {
  const colors = {
    'SC':       'bg-purple-100 text-purple-700 border-purple-200',
    'ST':       'bg-red-100 text-red-700 border-red-200',
    'OBC':      'bg-yellow-100 text-yellow-700 border-yellow-200',
    'General':  'bg-gray-100 text-gray-700 border-gray-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors[category] || colors.General}`}>
      {category}
    </span>
  );
};

// ─── Match Placeholder Card ───────────────────────────────────────────────────
const MatchPlaceholder = ({ completionPct }) => (
  <div className="card text-center py-10">
    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <FiBarChart2 size={28} className="text-blue-400" />
    </div>
    <h3 className="font-bold text-blue-900 text-lg mb-2">Your Match Results Will Appear Here</h3>
    <p className="text-gray-500 text-sm mb-5 max-w-sm mx-auto">
      {completionPct < 60
        ? 'Complete at least 60% of your profile to unlock AI-based internship matching.'
        : 'Our AI engine is preparing your personalised internship matches. Check back soon!'
      }
    </p>
    {completionPct < 60 && (
      <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-2 rounded-lg">
        <FiAlertCircle size={14} />
        Profile {completionPct}% complete — need 60% minimum
      </div>
    )}
    {completionPct >= 60 && (
      <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-2 rounded-lg">
        <FiClock size={14} />
        Matching engine running — results expected within 24 hrs
      </div>
    )}
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const { candidate: authCandidate, updateCandidate } = useAuth();
  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [editOpen, setEditOpen]     = useState(false);

  // Fetch full profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/candidates/profile/${authCandidate.id}`);
        if (res.data.success) {
          setProfile(res.data.candidate);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        // Fall back to auth context data
        setProfile(authCandidate);
      } finally {
        setLoading(false);
      }
    };

    if (authCandidate?.id) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [authCandidate]);

  // After edit, refresh profile
  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
    updateCandidate({
      fullName: updatedProfile.fullName,
      completionPercentage: updatedProfile.completionPercentage,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-blue-700 font-medium">Loading your profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Failed to load profile. Please refresh.</div>
      </div>
    );
  }

  const completionPct = profile.completionPercentage ?? 0;
  const allSkills = [...new Set([...(profile.skills || []), ...(profile.parsedSkills || [])])];

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Page Header ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">
              Welcome, {profile.fullName?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 text-sm">PM Internship Scheme — Candidate Dashboard</p>
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto"
          >
            <FiEdit2 size={15} /> Edit Profile
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left Column: Profile Card ─────────────────────── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Profile Summary Card */}
            <div className="card">
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {profile.fullName?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 truncate">{profile.fullName}</div>
                  <div className="text-sm text-gray-500 truncate">{profile.email}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <CategoryBadge category={profile.socialCategory} />
                    <span className="text-xs text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">
                      {profile.districtType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Completion Bar */}
              <CompletionBar percentage={completionPct} />

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-700">{allSkills.length}</div>
                  <div className="text-xs text-gray-500">Skills Listed</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-700">{(profile.sectorInterest || []).length}</div>
                  <div className="text-xs text-gray-500">Sectors of Interest</div>
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="card space-y-2.5">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                <FiInfo size={15} className="text-blue-600" /> Details
              </h3>
              <InfoCard icon={FiBook}     label="Degree"      value={profile.education?.degree} />
              <InfoCard icon={FiBook}     label="Stream"      value={profile.education?.stream} />
              <InfoCard icon={FiBook}     label="College"     value={profile.education?.college} />
              <InfoCard icon={FiBook}     label="Graduation"  value={profile.education?.graduationYear} />
              <InfoCard icon={FiMapPin}   label="Location"    value={[profile.locationPreference?.city, profile.locationPreference?.state].filter(Boolean).join(', ')} />
              <InfoCard icon={FiAward}    label="Category"    value={`${profile.socialCategory} · ${profile.districtType}`} accent />
              {profile.resumeUrl && (
                <InfoCard icon={FiUploadCloud} label="Resume" value="Uploaded ✓" accent />
              )}
            </div>

            {/* Affirmative Action Quota Info */}
            {(profile.socialCategory !== 'General' || profile.districtType !== 'Urban') && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2 text-green-700 font-semibold text-sm mb-1">
                  <FiCheckCircle size={15} /> Quota Benefits Active
                </div>
                <p className="text-xs text-green-600 leading-relaxed">
                  You qualify for reserved allocation under the{' '}
                  {profile.socialCategory !== 'General' ? `${profile.socialCategory} category` : ''}
                  {profile.socialCategory !== 'General' && profile.districtType !== 'Urban' ? ' and ' : ''}
                  {profile.districtType !== 'Urban' ? `${profile.districtType} district` : ''} quota.
                </p>
              </div>
            )}
          </div>

          {/* ── Right Column ──────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Match Results */}
            <MatchResults candidateId={profile?._id || authCandidate?.id} completionPct={completionPct} />

            {/* Skills Card */}
            <div className="card">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <FiTag size={15} className="text-blue-600" /> Skills Profile
              </h3>
              {allSkills.length > 0 ? (
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(profile.skills || []).map(s => (
                      <SkillBadge key={s} skill={s} />
                    ))}
                    {(profile.parsedSkills || []).map(s => (
                      !profile.skills?.includes(s) && <SkillBadge key={s} skill={s} parsed />
                    ))}
                  </div>
                  {profile.parsedSkills?.length > 0 && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <FiStar size={10} className="text-green-500" />
                      Skills with star icon were auto-extracted from your resume
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <FiTag size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No skills added yet. Edit your profile to add skills.</p>
                </div>
              )}
            </div>

            {/* Sector Interest Card */}
            <div className="card">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <FiBriefcase size={15} className="text-blue-600" /> Sector Interests
              </h3>
              {(profile.sectorInterest || []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.sectorInterest.map(sec => (
                    <span key={sec} className="px-3 py-1.5 bg-blue-700 text-white rounded-full text-xs font-semibold">
                      {sec}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No sectors selected. Edit your profile to add sector preferences.
                </div>
              )}
            </div>

            {/* Application Timeline Placeholder */}
            <div className="card">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <FiClock size={15} className="text-blue-600" /> Application Timeline
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Account Created',     done: true,  date: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN') : '—' },
                  { label: 'Profile Submitted',   done: completionPct >= 60, date: completionPct >= 60 ? 'Completed' : 'Pending' },
                  { label: 'AI Match Generated',  done: false, date: 'Awaiting profile completion' },
                  { label: 'Internship Allocated', done: false, date: 'Pending allocation' },
                ].map(({ label, done, date }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {done
                        ? <FiCheckCircle size={13} className="text-green-500" />
                        : <FiClock size={13} className="text-gray-400" />
                      }
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <span className={`text-sm font-medium ${done ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
                      <span className="text-xs text-gray-400">{date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>


          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
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
