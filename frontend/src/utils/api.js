/**
 * API Utility — PM Internship Scheme
 * utils/api.js
 *
 * Centralized axios API calls for candidate module.
 */

import axios from 'axios';

const BASE = '/api/candidates';

export const candidateAPI = {

  /** Register new candidate */
  register: (data) =>
    axios.post(`${BASE}/register`, data),

  /** Login candidate */
  login: (email, password) =>
    axios.post(`${BASE}/login`, { email, password }),

  /** Get profile by ID */
  getProfile: (id) =>
    axios.get(`${BASE}/profile/${id}`),

  /** Update profile */
  updateProfile: (id, data) =>
    axios.put(`${BASE}/profile/${id}`, data),

  /** Upload resume PDF */
  uploadResume: (id, file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return axios.post(`${BASE}/upload-resume/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default candidateAPI;
