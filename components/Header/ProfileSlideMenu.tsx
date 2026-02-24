'use client'
import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser } from '@/contexts/UserContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface UserData {
  name: string;
  email: string;
  uid: string;
  subscriptionActive: boolean;
}

interface ProfileSlideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userData?: UserData;
}

type MobilePanel = 'main' | 'language' | 'currency';

const DEFAULT_USER_DATA: UserData = {
  name: '',
  email: '',
  uid: '',
  subscriptionActive: false,
};

const CURRENCY_FLAG: Record<string, string> = {
  RUB: '🇷🇺',
  USD: '🇺🇸',
  AMD: '🇦🇲',
  EUR: '🇪🇺',
  TG_STARS: '⭐',
};

const PANEL_SUBTITLE: Record<string, { language: string; currency: string }> = {
  ru: {
    language: 'Выберите предпочитаемый язык',
    currency: 'Выберите предпочитаемую валюту',
  },
  en: {
    language: 'Choose your preferred language',
    currency: 'Choose your preferred currency',
  },
  am: {
    language: 'Ընտրեք նախընտրելի լեզուն',
    currency: 'Ընտրեք նախընտրելի արժույթը',
  },
};

const currencyLabel = (code: string, symbol: string) => {
  if (symbol && symbol !== code) return symbol;
  return code;
};

const languageFlag = (code: string, fallback?: string) => {
  if (fallback) return fallback;
  if (code === 'ru') return '🇷🇺';
  if (code === 'en') return '🇬🇧';
  if (code === 'am') return '🇦🇲';
  return '🏳️';
};

const currencyFlag = (code: string) => {
  return CURRENCY_FLAG[code] || '🏳️';
};

const ProfileSlideMenu: React.FC<ProfileSlideMenuProps> = ({
  isOpen,
  onClose,
  userData = DEFAULT_USER_DATA,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, languages, t } = useLanguage();
  const { logout } = useUser();
  const { currency, currencies, setCurrencyCode } = useCurrency();
  const [activePanel, setActivePanel] = useState<MobilePanel>('main');

  useEffect(() => {
    const handleReset = () => setActivePanel('main');
    window.addEventListener('profile-menu-reset', handleReset);
    return () => {
      window.removeEventListener('profile-menu-reset', handleReset);
    };
  }, []);

  const getInitials = (name: string): string => {
    if (!name || name.trim() === '') return '?';
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(userData.name);
  const subscriptionText = userData.subscriptionActive
    ? t('profile.subscription_active')
    : t('profile.subscription_inactive');
  const displayName = userData.name || userData.email || '---';
  const usernameRaw = userData.email || '';
  const displayUsername =
    usernameRaw && usernameRaw !== displayName
      ? (usernameRaw.includes('@') ? usernameRaw : `@${usernameRaw}`)
      : '';
  const currentCurrency = currency.code;

  const currentLanguageLabel =
    languages.find((item) => item.code === language)?.native || t('language.name');

  const currentPanelTitle = useMemo(() => {
    if (activePanel === 'language') return t('profile.language');
    if (activePanel === 'currency') return t('profile.currency');
    return '';
  }, [activePanel, t]);

  const currentPanelSubtitle = useMemo(() => {
    const localized = PANEL_SUBTITLE[language] || PANEL_SUBTITLE.en;
    if (activePanel === 'language') {
      return localized.language;
    }
    if (activePanel === 'currency') {
      return localized.currency;
    }
    return '';
  }, [activePanel, language]);

  const handleClose = () => {
    setActivePanel('main');
    onClose();
  };

  const handleProfileCardClick = () => {
    onClose();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'profile' }));
    }
  };

  const handleProfileCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleProfileCardClick();
    }
  };

  const handleLogout = (event?: React.MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault();
    onClose();
    logout();
    window.location.href = '/auth/login';
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleSelectCurrency = async (code: string) => {
    setActivePanel('main');
    await setCurrencyCode(code);
  };

  const handleSelectLanguage = (code: string) => {
    setLanguage(code as typeof language);
    setActivePanel('main');
  };

  const menuClass = isOpen ? 'active' : '';

  return (
    <div
      className={`profile-slide-menu ${menuClass}`}
      id="profileSlideMenu"
      aria-hidden={!isOpen}
    >
      <div className={`profile-menu-panel profile-menu-panel-main ${activePanel === 'main' ? 'active' : ''}`}>
        <div className="profile-menu-header">
          <button className="profile-menu-close" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div
            className="profile-card"
            role="button"
            tabIndex={0}
            onClick={handleProfileCardClick}
            onKeyDown={handleProfileCardKeyDown}
          >
            <div className="profile-card-avatar" id="menuAvatar">{initials}</div>
            <div className="profile-card-info">
              <div className="profile-card-fullname" id="menuFullName">
                {displayName}
              </div>
              {displayUsername && (
                <div className="profile-card-username" id="menuUserName">
                  {displayUsername}
                </div>
              )}
              <div
                className={`subscription-badge ${userData.subscriptionActive ? '' : 'expired'}`}
                id="menuSubscriptionBadge"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span id="menuSubscriptionText">{subscriptionText}</span>
              </div>
            </div>
            <svg className="profile-card-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>

        <div className="profile-menu-divider"></div>

        <div className="profile-menu-content">
          <div className="profile-menu-item with-arrow" onClick={() => setActivePanel('language')}>
            <div className="profile-menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                <line x1="2" y1="12" x2="22" y2="12"></line>
              </svg>
            </div>
            <span>{t('profile.language')}</span>
            <span className="profile-menu-item-value">{currentLanguageLabel}</span>
          </div>

          <div className="profile-menu-item with-arrow" onClick={() => setActivePanel('currency')}>
            <div className="profile-menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <span>{t('profile.currency')}</span>
            <span className="profile-menu-item-value">{currentCurrency}</span>
          </div>

          <div className="profile-menu-item" onClick={handleThemeToggle}>
            <div className="profile-menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </div>
            <span>
              {theme === 'dark' ? t('profile.theme.dark') : t('profile.theme.light')}
            </span>
            <div className="theme-toggle-container">
              <div className={`theme-toggle ${theme === 'dark' ? 'active' : ''}`} id="themeToggle">
                <div className="theme-toggle-slider"></div>
              </div>
            </div>
          </div>

          <div className="profile-menu-divider"></div>

          <a href="#" className="profile-menu-item logout-menu-item" onClick={handleLogout}>
            <div className="profile-menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </div>
            <span>{t('profile.logout')}</span>
          </a>
        </div>
      </div>

      <div className={`profile-menu-panel profile-menu-panel-selector ${activePanel === 'language' ? 'active' : ''}`}>
        <div className="profile-selector-header">
          <button className="profile-selector-back" onClick={() => setActivePanel('main')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18L9 12L15 6"></path>
            </svg>
          </button>
        </div>
        <div className="profile-selector-title">{currentPanelTitle}</div>
        <div className="profile-selector-subtitle">{currentPanelSubtitle}</div>

        <div className="profile-selector-list">
          {languages.map((item) => {
            const isSelected = item.code === language;
            return (
              <button
                key={item.code}
                type="button"
                className={`profile-selector-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectLanguage(item.code)}
              >
                <span className="profile-selector-short">{languageFlag(item.code, item.flag)}</span>
                <span className="profile-selector-main">
                  <span className="profile-selector-name">{item.native}</span>
                  <span className="profile-selector-meta">{item.label}</span>
                </span>
                {isSelected ? (
                  <svg className="profile-selector-check" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`profile-menu-panel profile-menu-panel-selector ${activePanel === 'currency' ? 'active' : ''}`}>
        <div className="profile-selector-header">
          <button className="profile-selector-back" onClick={() => setActivePanel('main')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18L9 12L15 6"></path>
            </svg>
          </button>
        </div>
        <div className="profile-selector-title">{currentPanelTitle}</div>
        <div className="profile-selector-subtitle">{currentPanelSubtitle}</div>

        <div className="profile-selector-list">
          {currencies.map((item) => {
            const isSelected = item.code === currentCurrency;
            return (
              <button
                key={item.code}
                type="button"
                className={`profile-selector-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectCurrency(item.code)}
              >
                <span className="profile-selector-short">{currencyFlag(item.code)}</span>
                <span className="profile-selector-main">
                  <span className="profile-selector-name">{item.code}</span>
                  <span className="profile-selector-meta">{currencyLabel(item.code, item.symbol || item.code)}</span>
                </span>
                {isSelected ? (
                  <svg className="profile-selector-check" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileSlideMenu;
