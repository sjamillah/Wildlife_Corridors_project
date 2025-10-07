import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'authToken';

const auth = {
  register: async ({ email, password, name, role }) => {
    if (!email || !password) throw new Error('Email and password required');
    await new Promise(r => setTimeout(r, 300));
    const token = `mobile-mock-token-${Date.now()}`;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem('userProfile', JSON.stringify({ email, name, role }));
    return token;
  },
  login: async ({ email, password }) => {
    if (!email || !password) throw new Error('Email and password required');
    await new Promise(r => setTimeout(r, 200));
    const token = `mobile-mock-token-${Date.now()}`;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem('userProfile', JSON.stringify({ email }));
    return token;
  },
  logout: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem('userProfile');
  },
  getToken: async () => AsyncStorage.getItem(TOKEN_KEY),
  isAuthenticated: async () => !!(await AsyncStorage.getItem(TOKEN_KEY)),
  getProfile: async () => {
    try {
      const p = await AsyncStorage.getItem('userProfile');
      return p ? JSON.parse(p) : null;
    } catch (_e) { return null; }
  }
};

export default auth;
