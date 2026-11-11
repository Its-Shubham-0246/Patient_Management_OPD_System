import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../services/api';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (data: any) => Promise<{ success: boolean; error?: string; user?: User; uhid?: string }>;
  logout: () => Promise<void>;
  seedDemoUsers: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('smart_opd_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('smart_opd_token');
      if (storedToken) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        try {
          const res = await apiClient.get('/auth/me');
          if (res.data?.success && res.data.data?.user) {
            setUser(res.data.data.user);
            setAccessToken(storedToken);
          } else {
            throw new Error('Invalid user payload');
          }
        } catch (error) {
          // Token expired or invalid, try refresh
          try {
            const refreshRes = await apiClient.post('/auth/refresh');
            if (refreshRes.data?.success && refreshRes.data.data?.accessToken) {
              const newToken = refreshRes.data.data.accessToken;
              localStorage.setItem('smart_opd_token', newToken);
              apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
              setUser(refreshRes.data.data.user);
              setAccessToken(newToken);
            } else {
              handleLogoutCleanup();
            }
          } catch (refreshErr) {
            handleLogoutCleanup();
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const handleLogoutCleanup = () => {
    localStorage.removeItem('smart_opd_token');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    setAccessToken(null);
  };

  const login = async (loginIdentifier: string, password: string) => {
    try {
      const res = await apiClient.post('/auth/login', { loginIdentifier, password });
      if (res.data?.success && res.data.data) {
        const { user: loggedInUser, accessToken: token } = res.data.data;
        localStorage.setItem('smart_opd_token', token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(loggedInUser);
        setAccessToken(token);
        return { success: true, user: loggedInUser };
      }
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Authentication failed. Please verify your credentials.';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (data: any) => {
    try {
      const res = await apiClient.post('/auth/register', data);
      if (res.data?.success && res.data.data) {
        const { user: newUser, accessToken: token, patient } = res.data.data;
        localStorage.setItem('smart_opd_token', token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(newUser);
        setAccessToken(token);
        return { success: true, user: newUser, uhid: patient?.uhid };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Registration failed. Please check the inputs.';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      handleLogoutCleanup();
    }
  };

  const seedDemoUsers = async () => {
    try {
      const res = await apiClient.post('/auth/seed');
      return !!res.data?.success;
    } catch (e) {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        seedDemoUsers
      }}
    >
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

