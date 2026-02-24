'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Header.css';
import Logo from './Logo';
import ProfileDropdown from './ProfileDropdown';
import ProfileAvatar from './ProfileAvatar';
import { useUser } from '@/contexts/UserContext';
import ProfileSlideMenu from './ProfileSlideMenu';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

type PageType =
  | 'home'
  | 'subscription'
  | 'invite'
  | 'raffle'
  | 'locations'
  | 'devices'
  | 'help'
  | 'install'
  | 'profile'
  | 'payment'
  | 'history';

const ACTIVE_PAGE_STORAGE_KEY = 'opengater_active_page';
const ROOT_MOBILE_PAGES: PageType[] = ['home', 'subscription', 'help'];

const getStoredActivePage = (): PageType => {
  if (typeof window === 'undefined') return 'home';
  const storedPage = window.localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY);
  return storedPage && isPageType(storedPage) ? storedPage : 'home';
};

const getStoredAuthLabelFallback = (): string => {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('ga_user_email') ||
    localStorage.getItem('auth_user_label') ||
    ''
  );
};

const isPageType = (value: string): value is PageType => {
  return [
    'home',
    'subscription',
    'invite',
    'raffle',
    'locations',
    'devices',
    'help',
    'install',
    'profile',
    'payment',
    'history',
  ].includes(value);
};

const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTs, setCurrentTs] = useState(() => Date.now());
  const [activePage, setActivePage] = useState<PageType>('home');
  const [authLabelFallback, setAuthLabelFallback] = useState('');
  const { user, isLoading } = useUser();
  const { toggleTheme } = useTheme();
  const { t } = useLanguage();

  const normalizedFallback = authLabelFallback.trim();
  const userEmail = user?.email || (user?.username?.includes('@') ? user.username : '');
  const fallbackEmail = normalizedFallback.includes('@') ? normalizedFallback : '';
  const name = user?.full_name || userEmail || user?.username || normalizedFallback || (isLoading ? '' : 'Гость');
  const email = userEmail || fallbackEmail;
  const uid = user?.id ? String(user.id) : '';
  const subscriptionActive = !!user && new Date(user.expire).getTime() > currentTs;

  const userData = {
    name,
    email,
    uid,
    subscriptionActive,
  };

  const getInitials = (sourceName: string): string => {
    if (!sourceName) return '?';
    return sourceName
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(userData.name);

  const mobileTitle = useMemo(() => {
    switch (activePage) {
      case 'invite':
        return t('referral.header_title');
      case 'locations':
        return t('locations.header_title');
      case 'devices':
        return t('devices.page_title');
      case 'install':
        return t('setup.header_title');
      case 'profile':
        return t('profile.edit_profile');
      case 'payment':
        return t('payment.title');
      case 'history':
        return t('nav.history');
      case 'raffle':
        return t('nav.raffle');
      default:
        return '';
    }
  }, [activePage, t]);

  const isInnerMobilePage = !ROOT_MOBILE_PAGES.includes(activePage);

  const handleAvatarClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleCloseDropdown = () => {
    setIsDropdownOpen(false);
  };

  const handleOpenMobileMenu = () => {
    setIsMobileMenuOpen(true);
  };

  const handleCloseMobileMenu = () => {
    setIsMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('profile-menu-reset'));
    }
  };

  const handleMobileBack = () => {
    setActivePage('home');
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, 'home');
    window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'home' }));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      setAuthLabelFallback(getStoredAuthLabelFallback());
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      setActivePage(getStoredActivePage());
    }, 0);

    const handleNavigate = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail && isPageType(detail)) {
        setActivePage(detail);
      }
    };

    window.addEventListener('app:navigate', handleNavigate as EventListener);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('app:navigate', handleNavigate as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleOpen = () => setIsMobileMenuOpen(true);
    window.addEventListener('open-profile-menu', handleOpen);
    return () => {
      window.removeEventListener('open-profile-menu', handleOpen);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTs(Date.now());
    }, 60 * 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <>
      <div
        className={`profile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        id="profileMenuOverlay"
        onClick={handleCloseMobileMenu}
      ></div>
      <ProfileSlideMenu
        isOpen={isMobileMenuOpen}
        onClose={handleCloseMobileMenu}
        userData={userData}
      />

      <header className="header">
        <div className="header-content">
          <Logo />
          <div className="header-actions">
            <button
              className="theme-switcher"
              type="button"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              <svg className="theme-icon moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              <svg className="theme-icon sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            </button>
            <div className="profile-dropdown-container" ref={dropdownRef}>
              <ProfileAvatar initials={initials} onClick={handleAvatarClick} />
              <ProfileDropdown
                isOpen={isDropdownOpen}
                onClose={handleCloseDropdown}
                userData={userData}
              />
            </div>
          </div>
        </div>
      </header>

      <header className={`mobile-header ${isInnerMobilePage ? 'mobile-header--inner' : ''}`}>
        {isInnerMobilePage ? (
          <>
            <button
              className="mobile-back-button"
              type="button"
              onClick={handleMobileBack}
              aria-label={t('common.back')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18L9 12L15 6"></path>
              </svg>
            </button>
            <div className="mobile-header-title">{mobileTitle}</div>
          </>
        ) : (
          <Logo />
        )}

        <button
          className="profile-avatar mobile-profile-avatar"
          id="profile-avatar"
          title="Profile"
          onClick={handleOpenMobileMenu}
        >
          <span id="profile-initials" className="profile-initials visible">
            {initials || '?'}
          </span>
        </button>
      </header>
    </>
  );
};

export default Header;
