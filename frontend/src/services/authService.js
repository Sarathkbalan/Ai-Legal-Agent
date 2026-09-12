import apiClient from './apiClient';

const TOKEN_KEY = 'lawintel_auth_token';
const USER_KEY = 'lawintel_auth_user';
const ROLE_KEY = 'lawintel_user_role';

export const authService = {
  /**
   * Registers a new user (supports multiple user accounts)
   */
  async register(name, email, password) {
    const response = await apiClient.post('/auth/register', { name, email, password });
    if (response?.data) {
      const { token, user } = response.data;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(ROLE_KEY, user.role);
      return user;
    }
    throw new Error('Registration failed: no data received');
  },

  /**
   * User login with email & password
   */
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response?.data) {
      const { token, user } = response.data;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(ROLE_KEY, user.role);
      return user;
    }
    throw new Error('Login failed: no data received');
  },

  /**
   * Single Admin 1-Click Login
   */
  async loginAsSingleAdmin() {
    try {
      return await this.login('admin123@gmail.com', 'admin123');
    } catch (err) {
      // Fallback to switchRole
      return await this.switchRole('admin');
    }
  },

  /**
   * Switches active persona / role ('admin' or 'user')
   */
  async switchRole(role) {
    try {
      const response = await apiClient.post('/auth/switch-role', { role });
      if (response?.data) {
        const { token, user } = response.data;
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem(ROLE_KEY, user.role);
        return user;
      }
    } catch (err) {
      console.error('Failed to switch role:', err);
      const fallbackUser = {
        email: role === 'admin' ? 'admin123@gmail.com' : 'user@lawintel.uk',
        role,
        name: role === 'admin' ? 'Legal Ops Administrator' : 'Associate Legal Researcher'
      };
      localStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
      localStorage.setItem(ROLE_KEY, role);
      return fallbackUser;
    }
  },

  /**
   * Gets the stored user or returns null if not authenticated
   */
  getStoredUser() {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const stored = localStorage.getItem(USER_KEY);
      if (token && stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // ignore
    }
    return null;
  },

  /**
   * Fetches current profile from backend
   */
  async getMe() {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data?.user || this.getStoredUser();
    } catch (err) {
      return this.getStoredUser();
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
  }
};
