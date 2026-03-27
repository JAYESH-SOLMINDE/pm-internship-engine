/**
 * LoginPage — PM Internship Scheme
 * components/auth/LoginPage.js
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiLogIn } from 'react-icons/fi';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/candidates/login', form);
      if (res.data.success) {
        login(res.data.candidate, res.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo credentials helper
  const fillDemo = () => setForm({ email: 'arjun.sharma@example.com', password: 'Password@123' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-800 rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-bold text-lg">MCA</span>
          </div>
          <h1 className="text-2xl font-bold text-blue-900">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your PM Internship account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8">

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 text-red-700 text-sm">
              <FiAlertCircle className="mt-0.5 flex-shrink-0" size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="you@example.com"
                  className="form-input pl-9" autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type={showPass ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="Enter your password"
                  className="form-input pl-9 pr-10" autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</>
                : <><FiLogIn size={16} /> Sign In</>
              }
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-700 font-semibold mb-1.5">🔑 Demo Credentials (seed data)</p>
            <p className="text-xs text-gray-600">Email: <span className="font-mono">arjun.sharma@example.com</span></p>
            <p className="text-xs text-gray-600">Password: <span className="font-mono">Password@123</span></p>
            <button onClick={fillDemo} className="text-xs text-blue-600 hover:underline mt-1.5 font-medium">
              Auto-fill →
            </button>
          </div>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-gray-500 mt-5">
          New candidate?{' '}
          <Link to="/register" className="text-blue-700 font-semibold hover:underline">
            Register for PM Internship Scheme
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
