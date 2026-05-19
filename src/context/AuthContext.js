'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { gasLogin, getStoredUser, storeUser, clearUser } from '../api/gasClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const result = await gasLogin(email.trim(), password);
      console.log('Login Result:', result);
      
      if (result.ok) {
        const userData = { ...result.user, password };
        storeUser(userData);
        setUser(userData);
        return { ok: true };
      } else {
        clearUser();
        setError(result.error || 'Login failed. Please check your password.');
        return { ok: false, error: result.error };
      }
    } catch (err) {
      const msg = 'Could not reach the server. Check your connection.';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearUser();
    setUser(null);
    setError('');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
