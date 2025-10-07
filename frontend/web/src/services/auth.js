// Simple auth service for local, mocked authentication
const TOKEN_KEY = 'authToken';

const auth = {
  register: async ({ email, password, name }) => {
    // Basic validation (mock)
    if (!email || !password) throw new Error('Email and password required');
    // Simulate server-side delay
    await new Promise(r => setTimeout(r, 300));
    const token = `mock-token-${Date.now()}`;
    localStorage.setItem(TOKEN_KEY, token);
    // Optionally store a minimal profile
    localStorage.setItem('userProfile', JSON.stringify({ email, name }));
    return token;
  },
  login: async ({ email, password }) => {
    if (!email || !password) throw new Error('Email and password required');
    await new Promise(r => setTimeout(r, 200));
    const token = `mock-token-${Date.now()}`;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('userProfile', JSON.stringify({ email }));
    return token;
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('userProfile');
  },
  getToken: () => localStorage.getItem(TOKEN_KEY),
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
  getProfile: () => {
    try { return JSON.parse(localStorage.getItem('userProfile')); } catch { return null; }
  }
};

export default auth;
