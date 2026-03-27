/**
 * Landing Page — PM Internship Scheme
 * components/candidate/LandingPage.js
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight, FiCheckCircle, FiUsers, FiBriefcase,
  FiTrendingUp, FiShield, FiGlobe, FiAward
} from 'react-icons/fi';

const stats = [
  { label: 'Internship Opportunities', value: '1 Crore+', icon: FiBriefcase },
  { label: 'Registered Candidates', value: '2.8 Lakh+', icon: FiUsers },
  { label: 'Partner Companies', value: '500+', icon: FiTrendingUp },
  { label: 'States Covered', value: '28', icon: FiGlobe },
];

const features = [
  {
    icon: FiTrendingUp,
    title: 'AI-Powered Matching',
    desc: 'Our ML engine matches your skills, location, and interests to the best internship opportunities across India.',
  },
  {
    icon: FiShield,
    title: 'Affirmative Action Quotas',
    desc: 'Reserved allocations for SC/ST/OBC candidates and those from rural and aspirational districts.',
  },
  {
    icon: FiAward,
    title: '₹5000/month Stipend',
    desc: 'All PM Internship placements come with a guaranteed monthly stipend and industry certification.',
  },
  {
    icon: FiCheckCircle,
    title: 'Transparent Allocation',
    desc: 'Government-grade transparent scoring and allocation process with end-to-end traceability.',
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen">

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-saffron/20 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 relative z-10">
          <div className="max-w-3xl">
            {/* Government badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Ministry of Corporate Affairs, Govt. of India
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              PM Internship
              <span className="block text-yellow-400">Scheme 2024–25</span>
            </h1>

            <p className="text-blue-100 text-lg md:text-xl mb-4 leading-relaxed">
              India's largest government-backed internship programme — connecting
              skilled youth with top corporations through AI-powered smart allocation.
            </p>

            <p className="text-blue-200 text-base mb-10">
              Problem Statement #25033 · Smart Allocation Engine
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold px-8 py-3.5 rounded-xl transition-all text-base shadow-lg hover:shadow-xl"
              >
                Apply Now <FiArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-base"
              >
                Sign In to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────────── */}
      <section className="bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-50 rounded-xl mb-2">
                  <Icon size={20} className="text-blue-700" />
                </div>
                <div className="text-2xl font-bold text-blue-900">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-3">Why PM Internship Scheme?</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              India's first AI-driven government internship allocation system ensuring fair,
              transparent, and skill-based placements.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card hover:shadow-md transition-shadow">
                <div className="w-11 h-11 bg-blue-700 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="font-bold text-blue-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">Ready to kickstart your career?</h2>
          <p className="text-gray-600 mb-8">
            Register today. Build your profile. Let our AI find the perfect internship for you.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 btn-primary text-base px-10 py-3.5"
          >
            Create Free Account <FiArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="bg-blue-900 text-blue-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="font-bold text-white mb-1">PM Internship Scheme — Smart Allocation Engine</div>
          <div className="text-sm">Ministry of Corporate Affairs, Government of India</div>
          <div className="text-xs mt-3 text-blue-400">Problem Statement ID: 25033 · Built with ♥ for Bharat</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
