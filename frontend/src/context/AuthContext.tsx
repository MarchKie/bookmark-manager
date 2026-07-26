import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { setAuthTokenGetter } from '../services/api';

interface AuthContextType {
  themeMode: 'dark' | 'light';
  toggleThemeMode: () => void;
  getAccessToken: () => Promise<string | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme_mode');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const toggleThemeMode = () => {
    setThemeMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme_mode', next);
      return next;
    });
  };

  const getAccessToken = async (): Promise<string | undefined> => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'https://bbl-candidate-test-api',
        },
      });
      return token;
    } catch (err) {
      console.warn('Error fetching Auth0 access token:', err);
      return undefined;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setAuthTokenGetter(getAccessToken);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  return (
    <AuthContext.Provider value={{ themeMode, toggleThemeMode, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAppAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAppAuth must be used within an AuthProvider');
  }
  return context;
};
