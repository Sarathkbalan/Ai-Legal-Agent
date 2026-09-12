import apiClient from './apiClient';

export const fetchAuditLogs = async (params = {}) => {
  return apiClient.get('/audit/logs', { params });
};

export const fetchSystemStats = async () => {
  return apiClient.get('/audit/stats');
};

export const checkHealth = async () => {
  return apiClient.get('/health');
};
