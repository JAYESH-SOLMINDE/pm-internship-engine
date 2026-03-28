// frontend/src/pages/AdminLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

const AdminLogin = () => {
    const { loginAdmin, loading, error } = useAdmin();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await loginAdmin(form.email, form.password);
        if (result.success) navigate('/admin/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-xl">MCA</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                    <p className="text-gray-400 text-sm mt-1">PM Internship Scheme — Control Panel</p>
                </div>

                {/* Form */}
                <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Admin Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                placeholder="admin@pmscheme.gov.in"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                placeholder="••••••••"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors"
                        >
                            {loading ? 'Signing in...' : 'Sign In as Admin'}
                        </button>
                    </form>

                    <div className="mt-6 p-4 bg-gray-700/50 rounded-xl">
                        <p className="text-xs text-gray-400 font-medium mb-2">Demo Credentials:</p>
                        <p className="text-xs text-gray-300 font-mono">admin@pmscheme.gov.in</p>
                        <p className="text-xs text-gray-300 font-mono">Admin@2024</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;