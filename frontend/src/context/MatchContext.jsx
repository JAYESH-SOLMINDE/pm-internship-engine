// frontend/src/context/MatchContext.jsx
import { createContext, useContext, useState } from 'react';
import axios from 'axios';

const MatchContext = createContext();
const API = 'http://localhost:5001/api';

export function MatchProvider({ children }) {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchMatches = async (candidateId, topN = 10) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.get(`${API}/match/${candidateId}?topN=${topN}`);
            setMatches(data.matches || []);
            return { success: true, matches: data.matches };
        } catch (err) {
            const msg = err.response?.data?.message || 'Matching failed';
            setError(msg);
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    };

    return (
        <MatchContext.Provider value={{ matches, loading, error, fetchMatches }}>
            {children}
        </MatchContext.Provider>
    );
}

export const useMatch = () => useContext(MatchContext);