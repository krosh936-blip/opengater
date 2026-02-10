'use client'
import React, { useState, useEffect, useRef } from 'react';
import './Header.css';
import Logo from './Logo';
import ProfileDropdown from './ProfileDropdown';
import ProfileAvatar from './ProfileAvatar';
import { useUser } from '@/contexts/UserContext';
import ProfileSlideMenu from './ProfileSlideMenu';

const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading } = useUser();
  
  const name = user?.full_name || user?.username || (isLoading ? '' : 'Гость');
  const email = user?.username || '';
  const uid = user?.id ? String(user.id) : '';
  const subscriptionActive = !!user && new Date(user.expire).getTime() > Date.now();
  const userData = {
    name,
    email,
    uid,
    subscriptionActive,
  };
  
  // Получаем инициалы
  const getInitials = (name: string): string => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const initials = getInitials(userData.name);
  
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
  };
  
  // Закрытие dropdown при клике вне его
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
  
  // Закрытие по Escape
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
            <div className="profile-dropdown-container" ref={dropdownRef}>
              <ProfileAvatar 
                initials={initials} 
                onClick={handleAvatarClick}
              />
              <ProfileDropdown 
                isOpen={isDropdownOpen}
                onClose={handleCloseDropdown}
                userData={userData}
              />
            </div>
          </div>
        </div>
      </header>

      <header className="mobile-header">
        <Logo />
        <button
          className="profile-avatar"
          id="profile-avatar"
          title="Профиль"
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
