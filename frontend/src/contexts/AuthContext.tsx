import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, getAuthToken, clearAuthToken } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (storedToken) {
        setToken(storedToken);
        // Validate token with backend
        try {
          const response = await api.getProfile();
          setUser(response.user);
        } catch (error) {
          // Token is invalid, clear it
          console.warn('Invalid token, clearing authentication');
          clearAuthToken();
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    setUser(response.user);
    setToken(response.token);
    // Store token in localStorage
    localStorage.setItem('token', response.token);
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await api.signup(name, email, password);
    setUser(response.user);
    setToken(response.token);
    // Store token in localStorage
    localStorage.setItem('token', response.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuthToken();
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    signup,
    logout,
    loading,
    isAuthenticated: !!token, // Simplified - just check if token exists
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
