import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api';
import type { User } from '../types';
import { Alert } from 'react-native';
import io, { Socket } from 'socket.io-client';
import { BASE_URL } from '../api/apiClient';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: object) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authAPI.getMe();
      setUser(res.data.user);
    } catch {
      await AsyncStorage.multiRemove(['token', 'user']);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    let socket: Socket;
    if (user) {
      const serverUrl = BASE_URL.replace('/api', '');
      socket = io(serverUrl);

      socket.on('connect', () => {
        socket.emit('join', user._id);
        if (user.role === 'admin') socket.emit('join_admin');
      });

      socket.on('new_notification', (data) => {
        Alert.alert('New Notification', data.title + '\n' + data.message);
      });
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [user]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authAPI.login({ email, password });
    const { token, user: loggedInUser } = res.data;
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (data: object): Promise<User> => {
    const res = await authAPI.register(data);
    const { token, user: newUser } = res.data;
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  const logout = async (): Promise<void> => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
