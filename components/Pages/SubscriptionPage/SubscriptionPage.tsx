'use client'
import React, { useState, useEffect } from 'react';
import './SubscriptionPage.css';
import { useUser } from '@/contexts/UserContext'; // Импортируем хук
import { useLanguage } from '@/contexts/LanguageContext';

// Типы данных для подписок
interface SubscriptionLink {
  id: string;
  title: string;
  description: string;
  icon: 'global' | 'mirror' | 'vless' | 'fragment';
  value: string;
  type: 'url' | 'key';
}

interface AppInfo {
  id: string;
  name: string;
  icon: string;
}

const APP_DEEP_LINK_PREFIXES: Record<string, string> = {
  happ: 'happ://add/',
  karing: 'karing://install-config?url=',
  v2raytun: 'v2raytun://import/',
};

export default function SubscriptionPage() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [subscriptionLinks, setSubscriptionLinks] = useState<SubscriptionLink[]>([]);
  const [apps] = useState<AppInfo[]>([
    { id: 'happ', name: 'Happ', icon: '/resources/img/happ.png' },
    { id: 'karing', name: 'Karing', icon: '/resources/img/karing.png' },
    { id: 'v2raytun', name: 'v2RayTUN', icon: '/resources/img/v2.png' }
  ]);

  // Используем хук для получения данных пользователя
  const { user, isLoading, error, isAuthenticated } = useUser();
  const { t } = useLanguage();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string) => {
    setToast(message);
  };

  const buildFragmentLink = (value?: string | null) => {
    if (!value || value === t('common.unavailable')) return t('common.unavailable');
    if (value.endsWith('/f')) return value;
    return `${value.replace(/\/+$/, '')}/f`;
  };

  // Загрузка данных из API пользователя
  useEffect(() => {
    if (user && user.account) {
      const links: SubscriptionLink[] = [
        {
          id: 'global-url',
          title: t('subscription.global_title'),
          description: t('subscription.global_desc'),
          icon: 'global',
          value: user.account.global_subscription_url || t('common.unavailable'),
          type: 'url'
        },
        {
          id: 'fragment-url',
          title: t('subscription.fragment_title'),
          description: t('subscription.fragment_desc'),
          icon: 'fragment',
          value: buildFragmentLink(user.account.global_subscription_url),
          type: 'url'
        },
        {
          id: 'mirror-url',
          title: t('subscription.mirror_title'),
          description: t('subscription.mirror_desc'),
          icon: 'mirror',
          value: user.account.ru_subscription_url || t('common.unavailable'),
          type: 'url'
        },
        {
          id: 'vless-key',
          title: t('subscription.vless_title'),
          description: t('subscription.vless_desc'),
          icon: 'vless',
          value: user.account.vless_key || t('common.unavailable'),
          type: 'key'
        }
      ];
      
      setSubscriptionLinks(links);
    }
  }, [user, t]);

  const toggleDropdown = (dropdownId: string) => {
    setActiveDropdown((prev) => {
      if (prev === dropdownId) {
        setExpandedSubmenu(null);
        return null;
      }
      setExpandedSubmenu(null);
      return dropdownId;
    });
  };

  const closeAllDropdowns = () => {
    setActiveDropdown(null);
    setExpandedSubmenu(null);
  };

  const toggleSubmenu = (dropdownId: string) => {
    setExpandedSubmenu((prev) => (prev === dropdownId ? null : dropdownId));
  };

  const copyToClipboard = async (text: string, id: string) => {
    if (!text || text === t('common.unavailable')) return;
    
    try {
      await navigator.clipboard.writeText(text);
      showToast(t('common.copied'));
      
      const element = document.getElementById(id);
      if (element) {
        element.style.opacity = '0.5';
        setTimeout(() => {
          element.style.opacity = '1';
        }, 300);
      }
    } catch (err) {
      console.error('Ошибка копирования:', err);
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast(t('common.copied'));
    }
  };

  const handleAddToApp = (appId: string, linkId: string) => {
    const link = subscriptionLinks.find(l => l.id === linkId);
    if (!link || link.type !== 'url' || !link.value || link.value === t('common.unavailable')) return;
    const prefix = APP_DEEP_LINK_PREFIXES[appId];
    if (!prefix) {
      showToast(t('common.unavailable'));
      return;
    }
    const deepLink = appId === 'karing'
      ? `${prefix}${encodeURIComponent(link.value)}`
      : `${prefix}${link.value}`;

    window.location.href = deepLink;
    closeAllDropdowns();
  };

  // Иконки для разных типов
  const renderIcon = (iconType: 'global' | 'mirror' | 'vless' | 'fragment') => {
    switch (iconType) {
      case 'global':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
        );
      case 'mirror':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        );
      case 'vless':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
          </svg>
        );
      case 'fragment':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 3h5v5"></path>
            <path d="M8 3H3v5"></path>
            <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"></path>
            <path d="m15 9 6-6"></path>
          </svg>
        );
    }
  };

  // Если данные загружаются
  if (isLoading) {
    return (
      <div className="subscription-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Если есть ошибка
  if (error && !user) {
    return (
      <div className="subscription-page">
        <div className="error-container">
          <p style={{ color: 'red' }}>{t('common.error_prefix')}: {error}</p>
          <p>{t('common.check_token')}</p>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="subscription-page">
        <div className="auth-required">
          <p>{t('common.auth_required_subscriptions')}</p>
          <p>{t('common.add_token')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h1 className="hero-title">{t('subscription.hero_title')}</h1>
        <p className="hero-subtitle">{t('subscription.hero_subtitle')}</p>
      </div>

      {/* Subscription Cards */}
      {subscriptionLinks.map((link) => (
        <div key={link.id} className="subscription-card">
          <div className="card-header">
            <div className={`card-icon ${link.icon}`}>
              {renderIcon(link.icon)}
            </div>
            <div className="card-info">
              <div className="card-title">{link.title}</div>
              <div className="card-description">{link.description}</div>
            </div>
            <button 
              className="card-menu-btn" 
              onClick={() => toggleDropdown(link.id)}
              title={t('common.more')}
              aria-label={t('subscription.actions_menu_aria')}
              disabled={!link.value || link.value === t('common.unavailable')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2"></circle>
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="12" cy="19" r="2"></circle>
              </svg>
            </button>
          </div>
          
          <div className="link-field-wrapper">
            <div 
              className={`link-field ${(!link.value || link.value === t('common.unavailable')) ? 'link-field-disabled' : ''}`} 
              onClick={() => link.value && link.value !== t('common.unavailable') && copyToClipboard(link.value, link.id)}
              role="button"
              tabIndex={0}
              aria-label={`${(!link.value || link.value === t('common.unavailable')) ? `${t('common.unavailable')}: ` : `${t('common.copy')} `}${link.title}`}
            >
              <span className="link-text" id={link.id} style={{ transition: 'opacity 0.3s ease-out', opacity: 1 }}>
                {link.value}
              </span>
            </div>
          </div>

          {/* Dropdown Menu */}
          {activeDropdown === link.id && link.value && link.value !== t('common.unavailable') && (
            <div 
              className="dropdown-backdrop" 
              onClick={closeAllDropdowns}
              aria-label={t('common.close_menu')}
            />
          )}
          <div
            className={`action-dropdown ${activeDropdown === link.id && link.value && link.value !== t('common.unavailable') ? 'active' : ''}`}
            id={`dropdown-${link.id}`}
          >
            {link.type === 'url' && (
              <>
                <div
                  className={`dropdown-item has-submenu ${expandedSubmenu === link.id ? 'expanded' : ''}`}
                  onClick={() => toggleSubmenu(link.id)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"></path>
                  </svg>
                  <span>{t('subscription.add_to')}</span>
                </div>
                <div className="dropdown-submenu">
                  {apps.map(app => (
                    <div 
                      key={`${link.id}-${app.id}`}
                      className="submenu-item"
                      onClick={() => handleAddToApp(app.id, link.id)}
                    >
                      <img src={app.icon} alt={app.name} />
                      <span>{app.name}</span>
                    </div>
                  ))}
                </div>
                <div className="dropdown-divider"></div>
              </>
            )}
            <div 
              className="dropdown-item" 
              onClick={() => {
                copyToClipboard(link.value, link.id);
                closeAllDropdowns();
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>{t('common.copy')}</span>
            </div>
          </div>
        </div>
      ))}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
