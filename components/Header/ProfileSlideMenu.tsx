'use client'
import React, { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser } from '@/contexts/UserContext';

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

const DEFAULT_USER_DATA: UserData = {
  name: '',
  email: '',
  uid: '',
  subscriptionActive: false
};

const ProfileSlideMenu: React.FC<ProfileSlideMenuProps> = ({
  isOpen,
  onClose,
  userData = DEFAULT_USER_DATA
}) => {
  const { theme, toggleTheme } = useTheme();
  const { toggleLanguage, t } = useLanguage();
  const { logout } = useUser();
  const [menuState, setMenuState] = useState<'closed' | 'active'>('closed');

  useEffect(() => {
    if (isOpen && menuState === 'closed') {
      setMenuState('active');
    } else if (!isOpen && menuState === 'active') {
      const timer = setTimeout(() => {
        setMenuState('closed');
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, menuState]);

  const getInitials = (name: string): string => {
    if (!name || name.trim() === '') return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(userData.name);
  const subscriptionText = userData.subscriptionActive
    ? t('profile.subscription_active')
    : t('profile.subscription_inactive');
  const displayEmail = userData.email || 'Не указан';
  const displayUid = userData.uid || '-----';

  const handleClose = () => {
    onClose();
  };

  const copyUid = () => {
    if (userData.uid && navigator.clipboard) {
      navigator.clipboard.writeText(userData.uid);
    }
  };

  const showLanguageSelector = () => {
    toggleLanguage();
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

  if (menuState === 'closed') {
    return null;
  }

  const menuClass = isOpen ? 'active' : 'closing';

  return (
    <div className={`profile-slide-menu ${menuClass}`} id="profileSlideMenu">
      <div className="profile-menu-header">
        <button className="profile-menu-close" onClick={handleClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div className="profile-info">
          <div className="profile-info-avatar" id="menuAvatar">{initials}</div>
          <div className="profile-info-details">
            <div className="profile-email" id="menuEmail">
              {displayEmail}
            </div>
            <div className="profile-uid">
              ID · <span id="menuUid">{displayUid}</span>
              <button
                className="copy-uid-btn"
                onClick={copyUid}
                disabled={!userData.uid}
                title="Скопировать ID"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
            <div className="subscription-badge" id="menuSubscriptionBadge">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span id="menuSubscriptionText">{subscriptionText}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-menu-divider"></div>

      <div className="profile-menu-content">
        <div className="profile-menu-item with-arrow" onClick={showLanguageSelector}>
          <div className="profile-menu-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
          </div>
          <span data-i18n="profile.language" className="translated">{t('profile.language')}</span>
          <span className="profile-menu-item-value" id="current-language-display">
            {t('language.name')}
          </span>
        </div>

        <div className="profile-menu-item" onClick={handleThemeToggle}>
          <div className="profile-menu-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </div>
          <span data-i18n="profile.theme" className="translated">
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
          <span data-i18n="profile.logout" className="translated">{t('profile.logout')}</span>
        </a>
      </div>
    </div>
  );
};

export default ProfileSlideMenu;
