// frontend/src/components/PostInternshipModal.jsx
import { useState } from 'react';
import axios from 'axios';
import { useCompany } from '../context/CompanyContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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

const EMPTY = {
    title: '', description: '', skillInput: '', skillsRequired: [],
    sector: '', state: '', city: '',
    stipend: '', duration: '', totalSeats: '',
    applicationDeadline: '',
    general: '', obc: '', sc: '', st: '', rural: '', aspirational: '',
};

export default function PostInternshipModal({ onClose, onSuccess }) {
    const { token } = useCompany();
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const addSkill = () => {
        const s = form.skillInput.trim();
        if (s && !form.skillsRequired.includes(s))
            setForm((p) => ({ ...p, skillsRequired: [...p.skillsRequired, s], skillInput: '' }));
    };
    const removeSkill = (s) =>
        setForm((p) => ({ ...p, skillsRequired: p.skillsRequired.filter((x) => x !== s) }));

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await axios.post(
                `${API}/internships/create`,
                {
                    title: form.title, description: form.description,
                    skillsRequired: form.skillsRequired,
                    sector: form.sector,
                    state: form.state, city: form.city,
                    stipend: Number(form.stipend),
                    duration: form.duration,
                    totalSeats: Number(form.totalSeats),
                    applicationDeadline: form.applicationDeadline || undefined,
                    quotaBreakdown: {
                        general: Number(form.general) || 0,
                        obc: Number(form.obc) || 0,
                        sc: Number(form.sc) || 0,
                        st: Number(form.st) || 0,
                        rural: Number(form.rural) || 0,
                        aspirational: Number(form.aspirational) || 0,
                    },
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create internship');
        } finally {
            setLoading(false);
        }
    };

    const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
    const lbl = 'block text-xs font-semibold text-gray-600 mb-1';

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center py-10 px-4 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-blue-800">Post New Internship</h2>
                    <button onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                </div>

                <form onSubmit={submit} className="px-6 py-5 space-y-5">
                    {error && (
                        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-2 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Basic */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className={lbl}>Internship Title *</label>
                            <input name="title" value={form.title} onChange={set} required
                                placeholder="e.g. Data Science Intern" className={inp} />
                        </div>
                        <div>
                            <label className={lbl}>Sector *</label>
                            <select name="sector" value={form.sector} onChange={set} required className={inp}>
                                <option value="">Select sector</option>
                                {SECTORS.map((s) => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={lbl}>Duration *</label>
                            <input name="duration" value={form.duration} onChange={set} required
                                placeholder='e.g. "3 months"' className={inp} />
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
                            <input name="city" value={form.city} onChange={set} required
                                placeholder="e.g. Bengaluru" className={inp} />
                        </div>
                        <div>
                            <label className={lbl}>Monthly Stipend (₹) *</label>
                            <input name="stipend" type="number" min="0" value={form.stipend}
                                onChange={set} required placeholder="e.g. 12000" className={inp} />
                        </div>
                        <div>
                            <label className={lbl}>Total Seats *</label>
                            <input name="totalSeats" type="number" min="1" value={form.totalSeats}
                                onChange={set} required placeholder="e.g. 10" className={inp} />
                        </div>
                        <div>
                            <label className={lbl}>Application Deadline</label>
                            <input name="applicationDeadline" type="date" value={form.applicationDeadline}
                                onChange={set} className={inp} />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className={lbl}>Description *</label>
                        <textarea name="description" value={form.description} onChange={set}
                            required rows={3} placeholder="Describe the internship responsibilities..."
                            className={`${inp} resize-none`} />
                    </div>

                    {/* Skills */}
                    <div>
                        <label className={lbl}>Skills Required</label>
                        <div className="flex gap-2">
                            <input name="skillInput" value={form.skillInput} onChange={set}
                                placeholder="Type a skill and press Add"
                                className={`${inp} flex-1`}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
                            <button type="button" onClick={addSkill}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200">
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {form.skillsRequired.map((s) => (
                                <span key={s}
                                    className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                                    {s}
                                    <button type="button" onClick={() => removeSkill(s)}
                                        className="text-blue-500 hover:text-red-500 ml-1">&times;</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Quota Breakdown */}
                    <div>
                        <label className={lbl}>
                            Quota Breakdown — seats reserved per category (must not exceed total seats)
                        </label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {['general', 'obc', 'sc', 'st', 'rural', 'aspirational'].map((cat) => (
                                <div key={cat}>
                                    <label className="block text-xs text-gray-500 mb-1 capitalize">{cat}</label>
                                    <input name={cat} type="number" min="0" value={form[cat]}
                                        onChange={set} placeholder="0" className={inp} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-lg hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg disabled:opacity-60">
                            {loading ? 'Posting...' : 'Post Internship'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}