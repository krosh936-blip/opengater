'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserInfo, fetchUserInfo, getUserToken, removeUserToken, calculateDaysRemaining } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserContextType {
  user: UserInfo | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
  daysRemaining: string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { setLanguage } = useLanguage();

  const loadUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = getUserToken();
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      const userData = await fetchUserInfo();
      setUser(userData);
      setIsAuthenticated(true);
      if (userData?.language) {
        const raw = userData.language.toLowerCase();
        const nextLang = raw.includes('ru') || raw.includes('рус') ? 'ru' : raw.includes('en') ? 'en' : null;
        if (nextLang) {
          setLanguage(nextLang);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      setIsAuthenticated(false);
      
      // Если ошибка 401 или токен невалидный, удаляем токен
      if (err instanceof Error && err.message.includes('401')) {
        removeUserToken();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const logout = () => {
    removeUserToken();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const daysRemaining = user ? calculateDaysRemaining(user.expire) : '';

  return (
    <UserContext.Provider value={{
      user,
      isLoading,
      error,
      isAuthenticated,
      refreshUser,
      logout,
      daysRemaining,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
