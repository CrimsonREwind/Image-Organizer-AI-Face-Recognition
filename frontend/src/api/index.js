import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Stats API
export const statsApi = {
  getStats: () => api.get('/stats'),
  getRecent: () => api.get('/stats/recent'),
  getUnidentified: () => api.get('/stats/unidentified'),
  getPeopleSummary: () => api.get('/stats/people-summary'),
};

// People API
export const peopleApi = {
  getAll: (params) => api.get('/people', { params }),
  getById: (id) => api.get(`/people/${id}`),
  create: (data) => api.post('/people', data),
  update: (id, data) => api.put(`/people/${id}`, data),
  delete: (id, deleteImages = false) => 
    api.delete(`/people/${id}?delete_images=${deleteImages}`),
  getImages: (id, params) => api.get(`/people/${id}/images`, { params }),
};

// Images API
export const imagesApi = {
  getAll: (params) => api.get('/images', { params }),
  getById: (id) => api.get(`/images/${id}`),
  upload: (files, onProgress) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    return api.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },
  delete: (id) => api.delete(`/images/${id}`),
  assign: (id, personId) => api.patch(`/images/${id}/assign`, { person_id: personId }),
  reprocess: (id) => api.post(`/images/${id}/reprocess`),
};

export default api;
