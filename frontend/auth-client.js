const TOKEN_KEY = 'fitforge_token';
const USER_KEY = 'fitforge_user';

const Auth = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  getUser() {
    try {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearUser() {
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  login(token, user) {
    this.setToken(token);
    this.setUser(user);
  },

  logout() {
    this.clearToken();
    this.clearUser();
    window.location.href = '/login.html';
  },

  async fetch(url, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        this.logout();
        throw new Error('Session expired');
      }

      return response;
    } catch (err) {
      console.error('Fetch error:', err);
      throw err;
    }
  },

  checkAuth() {
    const path = window.location.pathname;
    const isLogin = path.includes('login.html');

    if (isLogin && this.isAuthenticated()) {
      window.location.href = '/index.html';
      return;
    }

    const protectedPaths = ['/index.html', '/exercises.html', '/routines.html', '/workout.html', '/progress.html', '/calendar.html', '/records.html'];
    const isProtected = path === '/' || protectedPaths.some(p => path.includes(p));

    if (isProtected && !this.isAuthenticated()) {
      window.location.href = '/login.html';
    }
  }
};

window.Auth = Auth;

document.addEventListener('DOMContentLoaded', () => {
  Auth.checkAuth();
});