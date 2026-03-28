// frontend/src/pages/InternshipListing.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import QuotaPills from '../components/QuotaPills';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const SECTORS = [
  'Finance','Technology','Manufacturing',
  'Healthcare','Agriculture','Education','Infrastructure',
];
const STATES = [
  'Andhra Pradesh','Bihar','Delhi','Gujarat','Haryana','Karnataka',
  'Madhya Pradesh','Maharashtra','Punjab','Rajasthan','Tamil Nadu',
  'Telangana','Uttar Pradesh','West Bengal',
];

const SECTOR_COLOR = {
  Finance:        'bg-blue-500',
  Technology:     'bg-purple-500',
  Manufacturing:  'bg-orange-400',
  Healthcare:     'bg-red-400',
  Agriculture:    'bg-green-500',
  Education:      'bg-yellow-400',
  Infrastructure: 'bg-gray-500',
};

function InternshipCard({ item }) {
  const co        = item.companyId;
  const seatsLeft = item.totalSeats - item.filledSeats;
  const pct       = Math.min((item.filledSeats / item.totalSeats) * 100, 100);

  return (
    <Link
      to={`/internships/${item._id}`}
      className="block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Sector colour stripe */}
      <div className={`h-1 w-full ${SECTOR_COLOR[item.sector] || 'bg-blue-400'}`} />

      <div className="p-5">
        {/* Title + company */}
        <div className="mb-3">
          <p className="font-bold text-gray-800 text-base leading-tight">{item.title}</p>
          <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1">
            🏢 {co?.companyName || 'Company'}
            {co?.verified && <span className="text-green-600 text-xs">✓</span>}
          </p>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-y-1.5 text-xs text-gray-500 mb-3">
          <span>📍 {item.location?.city}, {item.location?.state}</span>
          <span>🏷️ {item.sector}</span>
          <span>💰 ₹{item.stipend?.toLocaleString()}/month</span>
          <span>⏱ {item.duration}</span>
        </div>

        {/* Seat tracker */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{seatsLeft} seat{seatsLeft !== 1 ? 's' : ''} left</span>
            <span>{item.filledSeats} / {item.totalSeats} filled</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${
                pct >= 100 ? 'bg-red-400' : pct > 70 ? 'bg-yellow-400' : 'bg-green-400'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Skills */}
        {item.skillsRequired?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.skillsRequired.slice(0, 4).map((s) => (
              <span key={s}
                className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full border border-blue-100">
                {s}
              </span>
            ))}
            {item.skillsRequired.length > 4 && (
              <span className="text-xs text-gray-400">+{item.skillsRequired.length - 4} more</span>
            )}
          </div>
        )}

        {/* Quota Pills */}
        <div onClick={(e) => e.preventDefault()}>
          <QuotaPills internshipId={item._id} />
        </div>
      </div>
    </Link>
  );
}

export default function InternshipListing() {
  const [internships,  setInternships]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [total,        setTotal]        = useState(0);

  // Filters
  const [sector,     setSector]     = useState('');
  const [state,      setState]      = useState('');
  const [skill,      setSkill]      = useState('');
  const [minStipend, setMinStipend] = useState('');
  const [maxStipend, setMaxStipend] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (sector)     params.sector     = sector;
      if (state)      params.state      = state;
      if (skill)      params.skill      = skill;
      if (minStipend) params.minStipend = minStipend;
      if (maxStipend) params.maxStipend = maxStipend;

      const { data } = await axios.get(`${API}/internships/all`, { params });
      setInternships(data.internships || []);
      setTotal(data.count || 0);
    } catch {
      setInternships([]);
    } finally {
      setLoading(false);
    }
  }, [sector, state, skill, minStipend, maxStipend]);

  useEffect(() => { fetch(); }, [fetch]);

  const clear = () => {
    setSector(''); setState(''); setSkill('');
    setMinStipend(''); setMaxStipend('');
  };

  const hasFilters = sector || state || skill || minStipend || maxStipend;

  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white';

  const Filters = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Filters</h3>
        {hasFilters && (
          <button onClick={clear} className="text-xs text-blue-600 hover:underline">Clear all</button>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Sector</label>
        <select value={sector} onChange={(e) => setSector(e.target.value)} className={inp}>
          <option value="">All Sectors</option>
          {SECTORS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">State</label>
        <select value={state} onChange={(e) => setState(e.target.value)} className={inp}>
          <option value="">All States</option>
          {STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Skill (keyword)</label>
        <input value={skill} onChange={(e) => setSkill(e.target.value)}
          placeholder="e.g. Python, Excel..." className={inp} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Stipend Range (₹/month)</label>
        <div className="flex items-center gap-2">
          <input type="number" min="0" value={minStipend}
            onChange={(e) => setMinStipend(e.target.value)} placeholder="Min" className={inp} />
          <span className="text-gray-400 text-xs">–</span>
          <input type="number" min="0" value={maxStipend}
            onChange={(e) => setMaxStipend(e.target.value)} placeholder="Max" className={inp} />
        </div>
      </div>

      {/* Sector legend */}
      <div>
        <p className="text-xs font-semibold text-gray-400 mb-2">Sector colours</p>
        <div className="space-y-1">
          {SECTORS.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${SECTOR_COLOR[s]}`} />
              <span className="text-xs text-gray-600">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-blue-800 text-white py-10 px-6 text-center">
        <p className="text-blue-300 text-xs uppercase tracking-widest mb-2">
          Ministry of Corporate Affairs · PM Internship Scheme
        </p>
        <h1 className="text-3xl font-extrabold mb-2">Explore Internship Opportunities</h1>
        <p className="text-blue-200 text-sm max-w-xl mx-auto">
          Real-world internships with leading companies across India.
          All listings follow affirmative action quota norms.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Mobile filter toggle */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm flex items-center justify-center gap-2"
          >
            🔍 {sidebarOpen ? 'Hide Filters' : 'Show Filters'}
            {hasFilters && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {[sector,state,skill,minStipend,maxStipend].filter(Boolean).length} active
              </span>
            )}
          </button>
          {sidebarOpen && (
            <div className="mt-3 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <Filters />
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm sticky top-6">
              <Filters />
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : `${total} listing${total !== 1 ? 's' : ''} found`}
              </p>
              {hasFilters && (
                <button onClick={clear} className="text-xs text-blue-600 hover:underline">
                  Clear filters
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="w-10 h-10 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin mb-4" />
                <p className="text-sm">Loading internships...</p>
              </div>
            ) : internships.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-gray-500 font-semibold">No internships match your filters</p>
                <button onClick={clear} className="mt-4 text-blue-600 hover:underline text-sm">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {internships.map((i) => (
                  <InternshipCard key={i._id} item={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}