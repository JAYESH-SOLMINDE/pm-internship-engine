/**
 * Auth Context — PM Internship Scheme
 * context/AuthContext.js
 *
 * Manages candidate authentication state across the app.
 * Provides: { candidate, token, login, logout, updateCandidate, loading }
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ─── Axios Defaults ───────────────────────────────────────────────────────────
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [candidate, setCandidate] = useState(null);
  const [token, setToken]         = useState(null);
  const [loading, setLoading]     = useState(true); // true while checking localStorage

  // ── Restore session from localStorage on mount ───────────────────
  useEffect(() => {
    const savedToken     = localStorage.getItem('pm_token');
    const savedCandidate = localStorage.getItem('pm_candidate');

    if (savedToken && savedCandidate) {
      try {
        const parsedCandidate = JSON.parse(savedCandidate);
        setToken(savedToken);
        setCandidate(parsedCandidate);
        // Set default Authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch {
        // Corrupt data — clear it
        localStorage.removeItem('pm_token');
        localStorage.removeItem('pm_candidate');
      }
    }
    setLoading(false);
  }, []);

  // ── Login ────────────────────────────────────────────────────────
  const login = useCallback((candidateData, jwtToken) => {
    setCandidate(candidateData);
    setToken(jwtToken);
    localStorage.setItem('pm_token', jwtToken);
    localStorage.setItem('pm_candidate', JSON.stringify(candidateData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
  }, []);

  // ── Logout ───────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setCandidate(null);
    setToken(null);
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_candidate');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  // ── Update candidate data (after profile edit) ───────────────────
  const updateCandidate = useCallback((updatedData) => {
    setCandidate(prev => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('pm_candidate', JSON.stringify(merged));
      return merged;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      candidate,
      token,
      loading,
      login,
      logout,
      updateCandidate,
      isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Custom Hook ──────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
