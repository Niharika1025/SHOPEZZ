import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  // Fetch current user details
  const fetchCurrentUser = async () => {
    try {
      const { data } = await API.get('/users/profile');
      setUser(data.data || data);
    } catch (error) {
      console.log('No user session found');
      // If profile fails, try to silent refresh once
      try {
        const refreshRes = await API.post('/auth/refresh');
        const { accessToken, user: refreshedUser } = refreshRes.data;
        localStorage.setItem('token', accessToken);
        setUser(refreshedUser);
      } catch (refreshErr) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }

    // Set up interceptor for automatic token refresh on 401 response
    const interceptor = API.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const { data } = await API.post('/auth/refresh');
            localStorage.setItem('token', data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            return API(originalRequest);
          } catch (refreshError) {
            logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      API.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    localStorage.setItem('token', data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, role) => {
    const { data } = await API.post('/auth/register', { name, email, password, role });
    localStorage.setItem('token', data.accessToken);
    setUser(data.user);
    return data.user;
  };



  const updateProfile = async (profileData) => {
    const { data } = await API.put('/users/profile', profileData);
    setUser(data.data || data);
    return data.data || data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
