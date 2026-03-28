// frontend/src/context/CompanyContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CompanyContext = createContext();
const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export function CompanyProvider({ children }) {
  const [company, setCompany] = useState(null);
  const [token,   setToken]   = useState(localStorage.getItem('companyToken') || '');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Restore session on page reload
  useEffect(() => {
    const stored = localStorage.getItem('companyData');
    if (stored) setCompany(JSON.parse(stored));
  }, []);

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

  // ── Register ─────────────────────────────────────
  const registerCompany = async (formData) => {
    setLoading(true); setError('');
    try {
      const { data } = await axios.post(`${API}/companies/register`, formData);
      _saveSession(data);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      return { success: false, message: msg };
    } finally { setLoading(false); }
  };

  // ── Login ─────────────────────────────────────────
  const loginCompany = async (email, password) => {
    setLoading(true); setError('');
    try {
      const { data } = await axios.post(`${API}/companies/login`, { email, password });
      _saveSession(data);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      return { success: false, message: msg };
    } finally { setLoading(false); }
  };

  // ── Logout ────────────────────────────────────────
  const logoutCompany = () => {
    setCompany(null); setToken('');
    localStorage.removeItem('companyToken');
    localStorage.removeItem('companyData');
  };

  // ── Update profile ────────────────────────────────
  const updateCompanyProfile = async (id, updates) => {
    try {
      const { data } = await axios.put(`${API}/companies/profile/${id}`, updates, authHeaders());
      setCompany(data.company);
      localStorage.setItem('companyData', JSON.stringify(data.company));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  };

  // ── Internal helper ───────────────────────────────
  const _saveSession = (data) => {
    setCompany(data.company);
    setToken(data.token);
    localStorage.setItem('companyToken', data.token);
    localStorage.setItem('companyData', JSON.stringify(data.company));
  };

  return (
    <CompanyContext.Provider value={{
      company, token, loading, error,
      registerCompany, loginCompany, logoutCompany,
      updateCompanyProfile, authHeaders,
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);