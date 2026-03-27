// frontend/src/pages/CompanyRegister.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';

const SECTORS = [
    'Finance', 'Technology', 'Manufacturing',
    'Healthcare', 'Agriculture', 'Education', 'Infrastructure',
];

const STATES = [
    'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Odisha',
    'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export default function CompanyRegister() {
    const navigate = useNavigate();
    const { registerCompany, loading, error } = useCompany();
    const [localError, setLocalError] = useState('');

    const [form, setForm] = useState({
        companyName: '', email: '', password: '', confirmPassword: '',
        phone: '', sector: '', state: '', city: '',
        website: '', description: '',
    });

    const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setLocalError('');
        if (form.password !== form.confirmPassword)
            return setLocalError('Passwords do not match');
        if (form.password.length < 6)
            return setLocalError('Password must be at least 6 characters');

        const result = await registerCompany({
            companyName: form.companyName, email: form.email,
            password: form.password, phone: form.phone,
            sector: form.sector, state: form.state, city: form.city,
            website: form.website, description: form.description,
        });
        if (result.success) navigate('/company/dashboard');
    };

    const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
    const lbl = 'block text-xs font-semibold text-gray-600 mb-1';

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-10 px-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">

                {/* Header */}
                <div className="bg-blue-700 px-8 py-6">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🏢</span>
                        <div>
                            <h1 className="text-white text-xl font-bold">Company Registration</h1>
                            <p className="text-blue-200 text-xs mt-0.5">
                                PM Internship Scheme · Ministry of Corporate Affairs
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="px-8 py-6 space-y-4">

                    {/* Error */}
                    {(localError || error) && (
                        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">
                            {localError || error}
                        </div>
                    )}

                    {/* Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={lbl}>Company Name *</label>
                            <input name="companyName" value={form.companyName} onChange={set}
                                required placeholder="e.g. Infosys Ltd" className={inp} />
                        </div>
                        <div>
                            <label className={lbl}>Official Email *</label>
                            <input name="email" type="email" value={form.email} onChange={set}
                                required placeholder="hr@company.com" className={inp} />
                        </div>
                        <div>
                            <label className={lbl}>Password *</label>
                            <input name="password" type="password" value={form.password} onChange={set}
                                required placeholder="Min 6 characters" className={inp} />
                        </div>
                        <div>
                            <label className={lbl}>Confirm Password *</label>
                            <input name="confirmPassword" type="password" value={form.confirmPassword}
                                onChange={set} required placeholder="Re-enter password" className={inp} />
                        </div>
                        <div>
                            <label className={lbl}>Phone *</label>
                            <input name="phone" type="tel" value={form.phone} onChange={set}
                                required placeholder="10-digit number" className={inp} />
                        </div>
                        <div>
                            <label className={lbl}>Sector *</label>
                            <select name="sector" value={form.sector} onChange={set} required className={inp}>
                                <option value="">Select sector</option>
                                {SECTORS.map((s) => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={lbl}>State *</label>
                            <select name="state" value={form.state} onChange={set} required className={inp}>
                                <option value="">Select state</option>
                                {STATES.map((s) => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={lbl}>City *</label>
                            <input name="city" value={form.city} onChange={set}
                                required placeholder="e.g. Mumbai" className={inp} />
                        </div>
                    </div>

                    <div>
                        <label className={lbl}>Website (optional)</label>
                        <input name="website" value={form.website} onChange={set}
                            placeholder="https://yourcompany.com" className={inp} />
                    </div>
                    <div>
                        <label className={lbl}>Company Description (optional)</label>
                        <textarea name="description" value={form.description} onChange={set}
                            rows={3} placeholder="Brief overview of your company..."
                            className={`${inp} resize-none`} />
                    </div>

                    {/* Admin note */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                        ⚠️ Your account will be reviewed by MCA admin before your listings go live.
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60">
                        {loading ? 'Registering...' : 'Register Company'}
                    </button>

                    <p className="text-center text-sm text-gray-500">
                        Already registered?{' '}
                        <Link to="/company/login" className="text-blue-700 font-semibold hover:underline">
                            Login here
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}