import apiClient from './apiClient';

export const sendResearchQuery = async (payload) => {
  return apiClient.post('/research/query', payload);
};

export const fetchSessions = async () => {
  return apiClient.get('/research/sessions');
};

export const fetchSessionById = async (sessionId) => {
  return apiClient.get(`/research/sessions/${sessionId}`);
};
