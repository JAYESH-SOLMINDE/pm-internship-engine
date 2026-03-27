/**
 * Edit Profile Modal — PM Internship Scheme
 * components/dashboard/EditProfileModal.js
 *
 * Slide-over modal for editing candidate profile.
 * Covers: skills, sectors, location, education fields.
 */

import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  FiX, FiSave, FiPlus, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';

const SECTORS = [
  'Finance', 'Technology', 'Manufacturing', 'Healthcare',
  'Agriculture', 'Infrastructure', 'Education', 'Retail',
  'Logistics', 'Energy', 'Telecom', 'Media', 'Consulting', 'Other',
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh',
];

const DEGREES = ['B.Tech', 'B.E.', 'B.Sc', 'B.Com', 'BBA', 'BA', 'M.Tech', 'MBA', 'M.Sc', 'MA', 'Diploma', 'Other'];

const EditProfileModal = ({ profile, onClose, onSave }) => {
  const { candidate } = useAuth();

  // Form state initialized from profile
  const [skills, setSkills]       = useState(profile.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [sectors, setSectors]     = useState(profile.sectorInterest || []);
  const [education, setEducation] = useState({
    degree:         profile.education?.degree || '',
    stream:         profile.education?.stream || '',
    college:        profile.education?.college || '',
    graduationYear: profile.education?.graduationYear || '',
    percentage:     profile.education?.percentage || '',
  });
  const [location, setLocation]   = useState({
    state:            profile.locationPreference?.state || '',
    city:             profile.locationPreference?.city || '',
    willingToRelocate: profile.locationPreference?.willingToRelocate || false,
  });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  const addSkill = () => {
    const t = skillInput.trim();
    if (t && !skills.includes(t)) setSkills(prev => [...prev, t]);
    setSkillInput('');
  };

  const removeSkill = (s) => setSkills(prev => prev.filter(sk => sk !== s));

  const toggleSector = (sec) =>
    setSectors(prev => prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]);

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.put(`/api/candidates/profile/${candidate.id}`, {
        skills,
        sectorInterest: sectors,
        education: {
          ...education,
          graduationYear: parseInt(education.graduationYear) || undefined,
          percentage:     parseFloat(education.percentage)   || undefined,
        },
        locationPreference: location,
      });
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSave(res.data.candidate);
          onClose();
        }, 800);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-over Panel */}
      <div className="relative ml-auto w-full max-w-lg h-full bg-white shadow-2xl flex flex-col animate-slide-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-blue-700 text-white">
          <div>
            <h2 className="font-bold text-lg">Edit Profile</h2>
            <p className="text-blue-200 text-xs">Update your internship preferences</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-blue-600 rounded-lg transition-colors">
            <FiX size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Error / Success */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
              <FiAlertCircle size={15} /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm">
              <FiCheckCircle size={15} /> Profile updated successfully!
            </div>
          )}

          {/* ── Education ──────────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-3">Education</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Degree</label>
                  <select
                    value={education.degree}
                    onChange={e => setEducation(p => ({ ...p, degree: e.target.value }))}
                    className="form-input bg-white text-sm"
                  >
                    <option value="">Select</option>
                    {DEGREES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Graduation Year</label>
                  <input
                    type="number" value={education.graduationYear} min="2000" max="2030"
                    onChange={e => setEducation(p => ({ ...p, graduationYear: e.target.value }))}
                    className="form-input text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Stream / Subject</label>
                <input
                  type="text" value={education.stream}
                  onChange={e => setEducation(p => ({ ...p, stream: e.target.value }))}
                  placeholder="e.g. Computer Science"
                  className="form-input text-sm"
                />
              </div>
              <div>
                <label className="form-label">College / University</label>
                <input
                  type="text" value={education.college}
                  onChange={e => setEducation(p => ({ ...p, college: e.target.value }))}
                  placeholder="College name"
                  className="form-input text-sm"
                />
              </div>
              <div>
                <label className="form-label">Percentage / CGPA</label>
                <input
                  type="number" value={education.percentage} min="0" max="100"
                  onChange={e => setEducation(p => ({ ...p, percentage: e.target.value }))}
                  placeholder="e.g. 78.5"
                  className="form-input text-sm"
                />
              </div>
            </div>
          </section>

          {/* ── Skills ─────────────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-3">Skills</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text" value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a skill..."
                className="form-input flex-1 text-sm"
              />
              <button onClick={addSkill} className="btn-primary px-3">
                <FiPlus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map(s => (
                <span key={s} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-medium">
                  {s}
                  <button onClick={() => removeSkill(s)} className="hover:text-red-500 ml-0.5">
                    <FiX size={11} />
                  </button>
                </span>
              ))}
              {skills.length === 0 && (
                <span className="text-sm text-gray-400">No skills added yet.</span>
              )}
            </div>
          </section>

          {/* ── Sector Interest ────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-3">Sector Interest</h3>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map(sec => (
                <button
                  key={sec} type="button"
                  onClick={() => toggleSector(sec)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all
                    ${sectors.includes(sec)
                      ? 'bg-blue-700 border-blue-700 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'}`}
                >{sec}</button>
              ))}
            </div>
          </section>

          {/* ── Location ───────────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-3">Location Preference</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="form-label">State</label>
                <select
                  value={location.state}
                  onChange={e => setLocation(p => ({ ...p, state: e.target.value }))}
                  className="form-input bg-white text-sm"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">City</label>
                <input
                  type="text" value={location.city}
                  onChange={e => setLocation(p => ({ ...p, city: e.target.value }))}
                  placeholder="City" className="form-input text-sm"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={location.willingToRelocate}
                onChange={e => setLocation(p => ({ ...p, willingToRelocate: e.target.checked }))}
                className="w-4 h-4 accent-blue-700"
              />
              Willing to relocate for internship
            </label>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading || success}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              : success
              ? <><FiCheckCircle size={15} /> Saved!</>
              : <><FiSave size={15} /> Save Changes</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
