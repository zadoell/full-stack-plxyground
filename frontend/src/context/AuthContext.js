import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setToken, clearToken as clearApiToken } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('plxy_token');
        const storedUser = await AsyncStorage.getItem('plxy_user');
        if (stored && storedUser) {
          setToken(stored);
          setTokenState(stored);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Auth restore error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (tokenVal, userVal) => {
    setToken(tokenVal);
    setTokenState(tokenVal);
    setUser(userVal);
    await AsyncStorage.setItem('plxy_token', tokenVal);
    await AsyncStorage.setItem('plxy_user', JSON.stringify(userVal));
  }, []);

  const logout = useCallback(async () => {
    clearApiToken();
    setTokenState(null);
    setUser(null);
    await AsyncStorage.removeItem('plxy_token');
    await AsyncStorage.removeItem('plxy_user');
  }, []);

  const updateUser = useCallback(async (updatedUser) => {
    setUser(updatedUser);
    await AsyncStorage.setItem('plxy_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
