import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      authAPI.getMe()
        .then((res) => setUser(res.data.user))
        .catch(() => {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      sessionStorage.removeItem('user');
      setUser(null);
      setLoading(false);
    }
  }, []);

  const [toast, setToast] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let s;
    if (user) {
      s = io();
      setSocket(s);

      s.on('connect', () => {
        s.emit('join', user._id);
        if (user.role === 'admin') s.emit('join_admin');
      });

      s.on('new_notification', (data) => {
        setToast(data);
        setTimeout(() => setToast(null), 5000);
      });
    }

    return () => {
      if (s) s.disconnect();
    };
  }, [user]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    sessionStorage.setItem('token', res.data.token);
    sessionStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    sessionStorage.setItem('token', res.data.token);
    sessionStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    setSocket(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, socket }}>
      {children}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: 'linear-gradient(135deg, #1e1e2f, #252542)',
          borderLeft: '4px solid #00e5ff',
          padding: '16px 20px', borderRadius: 8,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          color: '#fff', minWidth: 300
        }}>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#00e5ff' }}>{toast.title}</h4>
          <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#cbd5e1' }}>{toast.message}</p>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
