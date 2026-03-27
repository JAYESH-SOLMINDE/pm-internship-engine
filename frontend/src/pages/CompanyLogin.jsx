// frontend/src/pages/CompanyLogin.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';

export default function CompanyLogin() {
  const navigate = useNavigate();
  const { loginCompany, loading, error } = useCompany();
  const [form, setForm] = useState({ email: '', password: '' });

  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const result = await loginCompany(form.email, form.password);
    if (result.success) navigate('/company/dashboard');
  };

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-blue-700 px-8 py-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏢</span>
            <div>
              <h1 className="text-white text-xl font-bold">Company Login</h1>
              <p className="text-blue-200 text-xs mt-0.5">
                PM Internship Scheme · Ministry of Corporate Affairs
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="px-8 py-7 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Registered Email
            </label>
            <input name="email" type="email" value={form.email} onChange={set}
              required placeholder="hr@company.com" className={inp} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Password
            </label>
            <input name="password" type="password" value={form.password} onChange={set}
              required placeholder="Enter your password" className={inp} />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60">
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              New company?{' '}
              <Link to="/company/register" className="text-blue-700 font-semibold hover:underline">
                Register here
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              Are you a candidate?{' '}
              <Link to="/login" className="text-blue-700 hover:underline">Candidate login</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}