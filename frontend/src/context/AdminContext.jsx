// frontend/src/context/AdminContext.jsx
import { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AdminContext = createContext();
const API = 'http://localhost:5001/api/admin';

export function AdminProvider({ children }) {
    const [admin, setAdmin] = useState(() => {
        const s = localStorage.getItem('adminData');
        return s ? JSON.parse(s) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('adminToken') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const authHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

    const loginAdmin = async (email, password) => {
        setLoading(true); setError('');
        try {
            const { data } = await axios.post(`${API}/login`, { email, password });
            setAdmin(data.admin);
            setToken(data.token);
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminData', JSON.stringify(data.admin));
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed';
            setError(msg);
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    };

    const logoutAdmin = () => {
        setAdmin(null); setToken('');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
    };

    return (
        <AdminContext.Provider value={{ admin, token, loading, error, loginAdmin, logoutAdmin, authHeaders }}>
            {children}
        </AdminContext.Provider>
    );
}

export const useAdmin = () => useContext(AdminContext);