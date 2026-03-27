/**
 * Navbar — PM Internship Scheme
 * components/candidate/Navbar.js
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiMenu, FiX, FiUser, FiLogOut, FiHome,
  FiBarChart2, FiChevronDown
} from 'react-icons/fi';

const Navbar = () => {
  const { isAuthenticated, candidate, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [dropOpen, setDropOpen]   = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
      {/* Top tricolor stripe */}
      <div className="tricolor-stripe" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* ── Brand ────────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            {/* Ashoka Chakra icon placeholder */}
            <div className="w-9 h-9 rounded-full bg-blue-800 flex items-center justify-center">
              <span className="text-white text-xs font-bold">MCA</span>
            </div>
            <div className="leading-tight">
              <div className="text-blue-900 font-bold text-sm leading-none">PM Internship</div>
              <div className="text-blue-500 text-xs">Smart Allocation Engine</div>
            </div>
          </Link>

          {/* ── Desktop Links ─────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive('/') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'}`}
            >
              <FiHome size={15} /> Home
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive('/dashboard') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'}`}
              >
                <FiBarChart2 size={15} /> Dashboard
              </Link>
            )}
          </div>

          {/* ── Auth Buttons ──────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold">
                    {candidate?.fullName?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {candidate?.fullName}
                  </span>
                  <FiChevronDown size={14} className="text-gray-500" />
                </button>

                {dropOpen && (
                  <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-blue-100 py-1 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-blue-50">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Candidate</div>
                      <div className="text-sm font-medium text-gray-800 truncate">{candidate?.fullName}</div>
                    </div>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      onClick={() => setDropOpen(false)}
                    >
                      <FiUser size={15} /> My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FiLogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Register Now</Link>
              </>
            )}
          </div>

          {/* ── Mobile Toggle ─────────────────────────────────────── */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-blue-50"
          >
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ───────────────────────────────────────────── */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-blue-100 px-4 py-3 space-y-1 animate-fade-in">
          <Link to="/" className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard" className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg" onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
          )}
          {isAuthenticated ? (
            <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
              Sign Out
            </button>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="btn-outline text-sm flex-1 text-center" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" className="btn-primary text-sm flex-1 text-center" onClick={() => setMenuOpen(false)}>Register</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
