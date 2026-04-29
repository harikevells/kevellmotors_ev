import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/franchiseApi';
import type { User } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  // Re-hydrate from storage on app launch
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [token, userJson] = await AsyncStorage.multiGet(['token', 'user']);
        const storedToken = token[1];
        const storedUser: User | null = userJson[1] ? JSON.parse(userJson[1]) : null;

        if (storedToken) {
          // Validate token is still alive
          const res = await authApi.getMe();
          setState({ user: res.data.user as User, token: storedToken, loading: false });
        } else {
          setState({ user: null, token: null, loading: false });
        }
      } catch {
        // Token invalid or network error – clear storage
        await AsyncStorage.multiRemove(['token', 'user']);
        setState({ user: null, token: null, loading: false });
      }
    };
    bootstrap();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authApi.login(email, password);
    const { token, user } = res.data;
    await AsyncStorage.multiSet([
      ['token', token],
      ['user', JSON.stringify(user)],
    ]);
    setState({ user: user as User, token, loading: false });
    return user as User;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setState({ user: null, token: null, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
};
