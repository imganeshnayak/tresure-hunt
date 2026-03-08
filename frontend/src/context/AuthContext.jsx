import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('treasure_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    else {
      // If no saved user, check for token in URL (from QR) and try to fetch user
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('t');
      if (urlToken) {
        localStorage.setItem('treasure_token', urlToken);
        // remove token param from URL
        params.delete('t');
        const newSearch = params.toString();
        const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`;
        window.history.replaceState({}, document.title, newUrl);
        // fetch user from backend
        api.get('/auth/me')
          .then(res => {
            const userData = res.data.user;
            setUser(userData);
            localStorage.setItem('treasure_user', JSON.stringify(userData));
          })
          .catch(() => {
            localStorage.removeItem('treasure_token');
          })
          .finally(() => setLoading(false));
        return;
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });

      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem('treasure_token', res.data.token);
      localStorage.setItem('treasure_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (username, password, teamName) => {
    try {
      const res = await api.post('/auth/register', { username, password, teamName });
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem('treasure_token', res.data.token);
      localStorage.setItem('treasure_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('treasure_user');
    localStorage.removeItem('treasure_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
