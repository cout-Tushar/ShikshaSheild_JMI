import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

export const studentApi = {
  getMyData: () => api.get('/students/me'),
  getAllStudents: () => api.get('/students'),
  getStudent: (id) => api.get(`/students/${id}`),
  updateStudent: (id, data) => api.put(`/students/${id}`, data),
  analyzeStudent: (id) => api.post(`/students/analyze/${id}`),
  uploadCSV: (formData) => api.post('/students/upload-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export default api;