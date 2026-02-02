'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'opengater-theme';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('dark');

  // Инициализация темы
  useEffect(() => {
    // Определяем текущую тему по классу на html
    const isLightTheme = document.documentElement.classList.contains('light-theme');
    const initialTheme = isLightTheme ? 'light' : 'dark';
    
    setThemeState(initialTheme);
    
    // Убираем initial-render класс после небольшой задержки
    setTimeout(() => {
      document.body.classList.remove('initial-render');
      document.documentElement.classList.remove('initial-render');
    }, 100);
  }, []);

  // Функция применения темы
  const applyTheme = (themeToApply: Theme, withTransition: boolean = true) => {
    const root = document.documentElement;
    const body = document.body;
    
    // Управление transition
    if (withTransition) {
      body.classList.add('theme-transition');
      root.classList.add('theme-transition');
    } else {
      body.classList.remove('theme-transition');
      root.classList.remove('theme-transition');
    }
    
    // Применяем тему через CSS класс
    if (themeToApply === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
    
    // Сохраняем в localStorage
    localStorage.setItem(THEME_STORAGE_KEY, themeToApply);
    
    // Убираем transition после анимации
    if (withTransition) {
      setTimeout(() => {
        body.classList.remove('theme-transition');
        root.classList.remove('theme-transition');
      }, 300);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    applyTheme(newTheme, true);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme, true);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};