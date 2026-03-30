/**
 * RegisterPage — PM Internship Scheme
 * components/auth/RegisterPage.js
 *
 * Multi-step registration:
 *  Step 1: Personal Info
 *  Step 2: Education + Category
 *  Step 3: Skills + Preferences + Resume Upload
 */

import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AadhaarVerify from '../AadhaarVerify';
import {
  FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff,
  FiUploadCloud, FiCheckCircle, FiX, FiPlus, FiAlertCircle,
  FiChevronRight, FiChevronLeft, FiBookOpen, FiMapPin
} from 'react-icons/fi';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEGREES = ['B.Tech', 'B.E.', 'B.Sc', 'B.Com', 'BBA', 'BA', 'M.Tech', 'MBA', 'M.Sc', 'MA', 'Diploma', 'Other'];

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

const CURRENT_YEAR = new Date().getFullYear();
const GRAD_YEARS   = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 2 + i);

// ─── Step Indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ currentStep }) => {
  const steps = [
    { n: 1, label: 'Personal Info' },
    { n: 2, label: 'Education' },
    { n: 3, label: 'Skills & Prefs' },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex flex-col items-center">
            <div className={`step-badge text-sm
              ${currentStep === s.n
                ? 'bg-blue-700 border-blue-700 text-white'
                : currentStep > s.n
                ? 'bg-green-500 border-green-500 text-white'
                : 'bg-white border-gray-300 text-gray-400'}`}
            >
              {currentStep > s.n ? <FiCheckCircle size={16} /> : s.n}
            </div>
            <div className={`text-xs mt-1 font-medium whitespace-nowrap
              ${currentStep >= s.n ? 'text-blue-700' : 'text-gray-400'}`}>
              {s.label}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-16 sm:w-24 mb-4 mx-1 transition-colors ${currentStep > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── Skill Tag ────────────────────────────────────────────────────────────────
const SkillTag = ({ skill, onRemove, color = 'blue' }) => (
  <span className={`inline-flex items-center gap-1 ${color === 'green' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'} border rounded-full px-3 py-1 text-xs font-medium`}>
    {skill}
    {onRemove && (
      <button onClick={() => onRemove(skill)} className="hover:text-red-500 ml-0.5 transition-colors">
        <FiX size={11} />
      </button>
    )}
  </span>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const RegisterPage = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();

  // Step tracking
  const [step, setStep]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Step 1 — Personal Info
  const [personal, setPersonal]   = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);

  // Step 2 — Education + Category
  const [education, setEducation] = useState({
    degree: '', stream: '', college: '', graduationYear: '', percentage: '',
  });
  const [category, setCategory]   = useState({ socialCategory: 'General', districtType: 'Urban' });

  // Step 3 — Skills + Preferences + Resume
  const [skills, setSkills]           = useState([]);
  const [skillInput, setSkillInput]   = useState('');
  const [sectors, setSectors]         = useState([]);
  const [location, setLocation]       = useState({ state: '', city: '', willingToRelocate: false });
  const [resumeFile, setResumeFile]   = useState(null);
  const [parsedSkills, setParsedSkills] = useState([]);
  const [uploading, setUploading]     = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [candidateId, setCandidateId] = useState(null);
  const fileInputRef = useRef(null);

  // ── Field handlers ─────────────────────────────────────────────
  const p = (setter) => (e) => setter(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Skill management ───────────────────────────────────────────
  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => setSkills(prev => prev.filter(s => s !== skill));

  const removeParsedSkill = (skill) => setParsedSkills(prev => prev.filter(s => s !== skill));

  const addParsedToSkills = (skill) => {
    if (!skills.includes(skill)) setSkills(prev => [...prev, skill]);
  };

  // ── Sector toggle ──────────────────────────────────────────────
  const toggleSector = (sector) => {
    setSectors(prev =>
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    );
  };

  // ── Step 1 validation ─────────────────────────────────────────
  const validateStep1 = () => {
    if (!personal.fullName.trim())       return 'Full name is required.';
    if (!personal.email.trim())          return 'Email is required.';
    if (!/^\S+@\S+\.\S+$/.test(personal.email)) return 'Enter a valid email address.';
    if (!personal.phone.trim())          return 'Phone number is required.';
    if (!/^[6-9]\d{9}$/.test(personal.phone)) return 'Enter a valid 10-digit Indian mobile number.';
    if (!personal.password)              return 'Password is required.';
    if (personal.password.length < 6)   return 'Password must be at least 6 characters.';
    if (personal.password !== personal.confirmPassword) return 'Passwords do not match.';
    if (!aadhaarVerified)                return 'Please verify your Aadhaar to continue.';
    return null;
  };

  // ── Step 2 validation ─────────────────────────────────────────
  const validateStep2 = () => {
    if (!education.degree)     return 'Please select your degree.';
    if (!education.stream)     return 'Stream / subject is required.';
    if (!education.college)    return 'College name is required.';
    if (!education.graduationYear) return 'Graduation year is required.';
    return null;
  };

  // ── Next step ──────────────────────────────────────────────────
  const handleNext = async () => {
    setError('');

    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }

      // Register on backend at step 1
      setLoading(true);
      try {
        const res = await axios.post('/api/candidates/register', {
          fullName: personal.fullName,
          email:    personal.email,
          password: personal.password,
          phone:    personal.phone,
          socialCategory: category.socialCategory,
          districtType:   category.districtType,
        });
        if (res.data.success) {
          setCandidateId(res.data.candidate.id);
          // Store token in context so later PUT calls are authenticated
          login(res.data.candidate, res.data.token);
          setStep(2);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
      setStep(3);
    }
  };

  // ── Resume upload ──────────────────────────────────────────────
  const handleResumeUpload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be under 2MB.');
      return;
    }
    setResumeFile(file);
    setError('');

    if (!candidateId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await axios.post(`/api/candidates/upload-resume/${candidateId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setParsedSkills(res.data.parsedSkills || []);
        setUploadSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Resume upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // ── Final submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('');
    if (skills.length === 0 && parsedSkills.length === 0) {
      setError('Please add at least one skill.');
      return;
    }
    if (sectors.length === 0) {
      setError('Please select at least one sector of interest.');
      return;
    }

    setLoading(true);
    try {
      const allSkills = [...new Set([...skills, ...parsedSkills])];
      await axios.put(`/api/candidates/profile/${candidateId}`, {
        education: {
          degree:         education.degree,
          stream:         education.stream,
          college:        education.college,
          graduationYear: parseInt(education.graduationYear),
          percentage:     parseFloat(education.percentage) || 0,
        },
        socialCategory:  category.socialCategory,
        districtType:    category.districtType,
        skills:          allSkills,
        parsedSkills:    parsedSkills,
        sectorInterest:  sectors,
        locationPreference: {
          state:            location.state,
          city:             location.city,
          willingToRelocate: location.willingToRelocate,
        },
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-800 rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-bold text-lg">MCA</span>
          </div>
          <h1 className="text-2xl font-bold text-blue-900">Create Your Account</h1>
          <p className="text-gray-500 text-sm mt-1">PM Internship Scheme — Candidate Registration</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 sm:p-8">
          <StepIndicator currentStep={step} />

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 text-red-700 text-sm animate-fade-in">
              <FiAlertCircle className="mt-0.5 flex-shrink-0" size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* ══════════════ STEP 1: Personal Info ══════════════ */}
          {step === 1 && (
            <div className="space-y-4 step-enter">
              <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-4">
                <FiUser className="text-blue-600" /> Personal Information
              </h2>

              {/* Full Name */}
              <div>
                <label className="form-label">Full Name *</label>
                <input
                  type="text" name="fullName" value={personal.fullName}
                  onChange={p(setPersonal)} placeholder="e.g. Arjun Sharma"
                  className="form-input"
                />
              </div>

              {/* Email */}
              <div>
                <label className="form-label">Email Address *</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email" name="email" value={personal.email}
                    onChange={p(setPersonal)} placeholder="you@example.com"
                    className="form-input pl-9"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="form-label">Mobile Number *</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="tel" name="phone" value={personal.phone}
                    onChange={p(setPersonal)} placeholder="10-digit mobile number"
                    maxLength={10} className="form-input pl-9"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="form-label">Password *</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type={showPass ? 'text' : 'password'} name="password"
                    value={personal.password} onChange={p(setPersonal)}
                    placeholder="Min. 6 characters" className="form-input pl-9 pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="form-label">Confirm Password *</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type={showConf ? 'text' : 'password'} name="confirmPassword"
                    value={personal.confirmPassword} onChange={p(setPersonal)}
                    placeholder="Re-enter password" className="form-input pl-9 pr-10"
                  />
                  <button type="button" onClick={() => setShowConf(!showConf)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConf ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              {/* Aadhaar Verification */}
              <div className="mt-6 mb-4">
                <AadhaarVerify onVerified={() => setAadhaarVerified(true)} />
              </div>

              <button onClick={handleNext} disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                {loading ? 'Creating account...' : <>Next: Education <FiChevronRight /></>}
              </button>
            </div>
          )}

          {/* ══════════════ STEP 2: Education + Category ══════════════ */}
          {step === 2 && (
            <div className="space-y-4 step-enter">
              <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-4">
                <FiBookOpen className="text-blue-600" /> Education & Category
              </h2>

              {/* Degree */}
              <div>
                <label className="form-label">Degree / Qualification *</label>
                <select name="degree" value={education.degree}
                  onChange={p(setEducation)} className="form-input bg-white">
                  <option value="">Select degree</option>
                  {DEGREES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>

              {/* Stream */}
              <div>
                <label className="form-label">Stream / Subject *</label>
                <input
                  type="text" name="stream" value={education.stream}
                  onChange={p(setEducation)} placeholder="e.g. Computer Science, Commerce"
                  className="form-input"
                />
              </div>

              {/* College */}
              <div>
                <label className="form-label">College / University *</label>
                <input
                  type="text" name="college" value={education.college}
                  onChange={p(setEducation)} placeholder="e.g. IIT Bombay, Delhi University"
                  className="form-input"
                />
              </div>

              {/* Graduation Year + Percentage */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Graduation Year *</label>
                  <select name="graduationYear" value={education.graduationYear}
                    onChange={p(setEducation)} className="form-input bg-white">
                    <option value="">Select year</option>
                    {GRAD_YEARS.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Percentage / CGPA</label>
                  <input
                    type="number" name="percentage" value={education.percentage}
                    onChange={p(setEducation)} placeholder="e.g. 78.5"
                    min="0" max="100" className="form-input"
                  />
                </div>
              </div>

              <div className="section-divider" />

              {/* Social Category */}
              <div>
                <label className="form-label">Social Category *</label>
                <div className="grid grid-cols-4 gap-2">
                  {['General', 'OBC', 'SC', 'ST'].map(cat => (
                    <button
                      key={cat} type="button"
                      onClick={() => setCategory(prev => ({ ...prev, socialCategory: cat }))}
                      className={`py-2 rounded-lg border text-sm font-semibold transition-all
                        ${category.socialCategory === cat
                          ? 'bg-blue-700 border-blue-700 text-white'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-blue-300'}`}
                    >{cat}</button>
                  ))}
                </div>
              </div>

              {/* District Type */}
              <div>
                <label className="form-label">District Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Urban', 'Rural', 'Aspirational'].map(dt => (
                    <button
                      key={dt} type="button"
                      onClick={() => setCategory(prev => ({ ...prev, districtType: dt }))}
                      className={`py-2 rounded-lg border text-sm font-semibold transition-all
                        ${category.districtType === dt
                          ? 'bg-blue-700 border-blue-700 text-white'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-blue-300'}`}
                    >{dt}</button>
                  ))}
                </div>
                {category.districtType !== 'Urban' && (
                  <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                    <FiCheckCircle size={12} />
                    {category.districtType === 'Aspirational'
                      ? 'You qualify for Aspirational District quota allocation.'
                      : 'Rural district candidates get preference in allocation.'}
                  </p>
                )}
              </div>

              {/* Navigation */}
              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)} className="btn-outline flex-1 flex items-center justify-center gap-2">
                  <FiChevronLeft /> Back
                </button>
                <button onClick={handleNext} disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Next: Skills <FiChevronRight />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════ STEP 3: Skills + Prefs + Resume ══════════════ */}
          {step === 3 && (
            <div className="space-y-5 step-enter">
              <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-4">
                <FiMapPin className="text-blue-600" /> Skills & Preferences
              </h2>

              {/* ── Manual Skill Input ─────────────────────────── */}
              <div>
                <label className="form-label">Skills *</label>
                <div className="flex gap-2">
                  <input
                    type="text" value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Type a skill and press Enter"
                    className="form-input flex-1"
                  />
                  <button onClick={addSkill}
                    className="btn-primary px-4 flex items-center gap-1">
                    <FiPlus size={16} />
                  </button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {skills.map(s => (
                      <SkillTag key={s} skill={s} onRemove={removeSkill} />
                    ))}
                  </div>
                )}
              </div>

              {/* ── Resume Upload ──────────────────────────────── */}
              <div>
                <label className="form-label">Upload Resume (PDF, max 2MB)</label>
                <div
                  className="upload-zone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    handleResumeUpload(e.dataTransfer.files[0]);
                  }}
                >
                  <input
                    type="file" ref={fileInputRef} accept="application/pdf"
                    className="hidden"
                    onChange={e => handleResumeUpload(e.target.files[0])}
                  />
                  {uploading ? (
                    <div className="text-blue-600">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <div className="text-sm font-medium">Parsing resume...</div>
                    </div>
                  ) : uploadSuccess ? (
                    <div className="text-green-600">
                      <FiCheckCircle size={28} className="mx-auto mb-2" />
                      <div className="text-sm font-semibold">{resumeFile?.name}</div>
                      <div className="text-xs text-green-500 mt-1">Upload successful! Click to replace.</div>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <FiUploadCloud size={28} className="mx-auto mb-2 text-blue-400" />
                      <div className="text-sm font-medium">Click or drag to upload resume</div>
                      <div className="text-xs text-gray-400 mt-1">PDF only · Max 2MB</div>
                    </div>
                  )}
                </div>

                {/* Parsed Skills Display */}
                {parsedSkills.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
                    <div className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                      <FiCheckCircle size={13} />
                      Skills auto-detected from resume:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {parsedSkills.map(s => (
                        <div key={s} className="flex items-center gap-1">
                          <SkillTag skill={s} onRemove={removeParsedSkill} color="green" />
                          {!skills.includes(s) && (
                            <button
                              onClick={() => addParsedToSkills(s)}
                              className="text-xs text-blue-600 hover:underline"
                              title="Add to your skills"
                            >+ add</button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Click <strong>× </strong>to remove a skill from auto-detected list.
                    </p>
                  </div>
                )}
              </div>

              {/* ── Sector Interest ────────────────────────────── */}
              <div>
                <label className="form-label">Sector Interest * (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map(sec => (
                    <button
                      key={sec} type="button"
                      onClick={() => toggleSector(sec)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all
                        ${sectors.includes(sec)
                          ? 'bg-blue-700 border-blue-700 text-white'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'}`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Location Preference ────────────────────────── */}
              <div>
                <label className="form-label">Location Preference</label>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <select
                      value={location.state}
                      onChange={e => setLocation(prev => ({ ...prev, state: e.target.value }))}
                      className="form-input bg-white text-sm"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <input
                      type="text" placeholder="City"
                      value={location.city}
                      onChange={e => setLocation(prev => ({ ...prev, city: e.target.value }))}
                      className="form-input text-sm"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={location.willingToRelocate}
                    onChange={e => setLocation(prev => ({ ...prev, willingToRelocate: e.target.checked }))}
                    className="w-4 h-4 accent-blue-700"
                  />
                  I am willing to relocate for the right opportunity
                </label>
              </div>

              {/* Navigation */}
              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(2)} className="btn-outline flex-1 flex items-center justify-center gap-2">
                  <FiChevronLeft /> Back
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {loading ? 'Saving...' : <><FiCheckCircle size={16} /> Complete Registration</>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sign in link */}
        <p className="text-center text-sm text-gray-500 mt-5">
          Already registered?{' '}
          <Link to="/login" className="text-blue-700 font-semibold hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
