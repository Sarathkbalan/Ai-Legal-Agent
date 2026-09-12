import apiClient from './apiClient';

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const uploadDocumentFromUrl = async (url, filename) => {
  return apiClient.post('/documents/upload-url', { url, filename });
};

export const fetchDocuments = async (params = {}) => {
  return apiClient.get('/documents', { params });
};

export const fetchDocumentById = async (id) => {
  return apiClient.get(`/documents/${id}`);
};

export const fetchDocumentChunks = async (id) => {
  return apiClient.get(`/documents/${id}/chunks`);
};

export const deleteDocument = async (id) => {
  return apiClient.delete(`/documents/${id}`);
};

export const fetchRejections = async () => {
  return apiClient.get('/documents/rejections');
};

export const fetchDocumentContent = async (id) => {
  return apiClient.get(`/documents/${id}/content`);
};

export const getDocumentDownloadUrl = (id) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
  return `${baseURL}/documents/${id}/download`;
};
