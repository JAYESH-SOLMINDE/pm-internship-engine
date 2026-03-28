/**
 * App.jsx — PM Internship Scheme
 * Root component with routing.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';
import { MatchProvider } from './context/MatchContext';
import { AdminProvider } from './context/AdminContext';

// Candidate Pages / Components
import RegisterPage from './components/auth/RegisterPage';
import LoginPage from './components/auth/LoginPage';
import Dashboard from './components/dashboard/Dashboard';
import Navbar from './components/candidate/Navbar';
import LandingPage from './components/candidate/LandingPage';

// Company Pages
import CompanyRegister from './pages/CompanyRegister';
import CompanyLogin from './pages/CompanyLogin';
import CompanyDashboard from './pages/CompanyDashboard';

// Internship Pages
import InternshipListing from './pages/InternshipListing';
import InternshipDetail from './pages/InternshipDetail';

// Admin Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

// ─── Protected Route Wrapper ──────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-blue-700">
      Loading...
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// ─── App Routes ───────────────────────────────────────────────────────────────
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        {/* ── Candidate Routes ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ── Internship Routes ── */}
        <Route path="/internships" element={<InternshipListing />} />
        <Route path="/internships/:id" element={<InternshipDetail />} />

        {/* ── Company Routes ── */}
        <Route path="/company/register" element={<CompanyRegister />} />
        <Route path="/company/login" element={<CompanyLogin />} />
        <Route path="/company/dashboard" element={<CompanyDashboard />} />

        {/* ── Admin Routes ── */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* ── Catch All ── */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
const App = () => (
  <BrowserRouter>
    <AdminProvider>
      <AuthProvider>
        <CompanyProvider>
          <MatchProvider>
            <AppRoutes />
          </MatchProvider>
        </CompanyProvider>
      </AuthProvider>
    </AdminProvider>
  </BrowserRouter>
);

export default App;