'use client'
import React, { useEffect, useMemo, useState } from 'react';
import './LocationsPage.css';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchAvailableLocations, updateLocations, LocationItem } from '@/lib/api';

interface LocationsPageProps {
  onBack?: () => void;
}

export default function LocationsPage({ onBack }: LocationsPageProps) {
  const { user, isLoading, error, isAuthenticated } = useUser();
  const { language, t } = useLanguage();
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.id) return;
      try {
        const data = await fetchAvailableLocations(user.id);
        if (mounted) {
          const filtered = Array.isArray(data) ? data.filter((loc) => !loc.hidden) : [];
          setLocations(filtered);
        }
      } catch {
        if (mounted) setLocations([]);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user?.id, t]);

  const selectedIds = useMemo(
    () => locations.filter((loc) => loc.selected).map((loc) => loc.id),
    [locations]
  );

  const selectedCountText = useMemo(() => {
    const count = selectedIds.length;
    if (language === 'ru') {
      const last = count % 10;
      const lastTwo = count % 100;
      if (lastTwo < 11 || lastTwo > 14) {
        if (last === 1) return t('locations.selected_count_one', { count });
        if (last >= 2 && last <= 4) return t('locations.selected_count_few', { count });
      }
      return t('locations.selected_count_many', { count });
    }
    return t('locations.selected_count', { count });
  }, [selectedIds.length, language, t]);

  const baseTariff = user?.tariff || 0;
  const locationsCost = locations
    .filter((loc) => loc.selected)
    .reduce((sum, loc) => sum + (loc.price || 0), 0);
  const totalMonthly = baseTariff + locationsCost;
  const formatCurrency = (valueRub: number) => `${valueRub}₽`;

  const localizeName = (name?: string) => {
    if (!name) return t('locations.unknown_location');
    if (language === 'en') return name;
    const key = name.trim().toLowerCase();
    const map: Record<string, string> = {
      'netherlands': 'Нидерланды',
      'germany': 'Германия',
      'usa': 'Америка',
      'us': 'Америка',
      'united states': 'Америка',
      'america': 'Америка',
      'russia': 'Россия',
      'turkey': 'Турция',
      'kazakhstan': 'Казахстан',
      'france': 'Франция',
    };
    return map[key] || name;
  };

  const localizeDescription = (desc?: string) => {
    if (!desc) return '';
    if (language === 'en') return desc;
    const key = desc.trim().toLowerCase();
    const map: Record<string, string> = {
      'amsterdam': 'Амстердам',
      'new jersey': 'Нью-Джерси',
      'frankfurt': 'Франкфурт',
      'saint petersburg': 'Санкт-Петербург',
      'st petersburg': 'Санкт-Петербург',
      'istanbul': 'Стамбул',
      'almaty': 'Алматы',
      'paris': 'Париж',
    };
    return map[key] || desc;
  };

  const toggleLocation = (id: number) => {
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === id ? { ...loc, selected: !loc.selected } : loc
      )
    );
  };

  const handleSave = async () => {
    if (!user?.id || selectedIds.length < 1) return;
    setIsSaving(true);
    try {
      await updateLocations(user.id, selectedIds);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="locations-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="locations-page">
        <div className="error-container">
          <p style={{ color: 'red' }}>{t('common.error_prefix')}: {error}</p>
          <p>{t('common.check_token')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="locations-page">
        <div className="auth-required">
          <p>{t('common.auth_required')}</p>
          <p>{t('common.add_token')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="locations-page">
      <header className="locations-mobile-header">
        <button className="back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12L12 19M5 12L12 5"></path>
          </svg>
        </button>
        <div className="header-title">{t('locations.header_title')}</div>
        <div className="header-spacer"></div>
      </header>

      <div className="hero-section">
        <div className="hero-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
        </div>
        <h1 className="hero-title">{t('locations.hero_title')}</h1>
        <p className="hero-subtitle">{t('locations.hero_subtitle')}</p>
      </div>

      <div className="selected-count-section">
        <div className="selected-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span className="selected-badge-text">{selectedCountText}</span>
        </div>
      </div>

      <div className="locations-grid">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className={`location-card ${loc.selected ? 'selected' : ''}`}
            onClick={() => toggleLocation(loc.id)}
          >
            <div className="location-header">
              <div className="location-info">
                <div className="location-flag">{loc.flag || '🏳️'}</div>
                <div className="location-details">
                  <h3>{localizeName(loc.name)}</h3>
                  <p>{localizeDescription(loc.description)}</p>
                </div>
              </div>
              <div className="location-checkbox">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            <div className="location-features">
              <div className="location-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span className="location-feature-value">+{formatCurrency(loc.price || 0)}</span>
              </div>
              <div className="location-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18"></path>
                  <path d="M18 9l-5 5-4-4-6 6"></path>
                </svg>
                <span className="location-feature-value">{loc.speed || 0} Gbps</span>
              </div>
              <div className="location-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <span className="location-feature-value">99.9%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pricing-summary">
        <div className="pricing-title">{t('locations.pricing_title')}</div>
        <div className="pricing-row">
          <span className="pricing-label">{t('locations.base_tariff')}</span>
          <span className="pricing-value">{formatCurrency(baseTariff)}</span>
        </div>
        <div className="pricing-row">
          <span className="pricing-label">{t('locations.selected_locations')}</span>
          <span className="pricing-value">{selectedIds.length}</span>
        </div>
        <div className="pricing-row">
          <span className="pricing-label">{t('locations.locations_cost')}</span>
          <span className="pricing-value">{formatCurrency(locationsCost)}</span>
        </div>
        <div className="pricing-row">
          <span className="pricing-label pricing-total-label">{t('locations.total_monthly')}</span>
          <span className="pricing-value pricing-total">{formatCurrency(totalMonthly)}</span>
        </div>
      </div>

      <div className="bottom-actions">
        <button
          className="save-button"
          onClick={handleSave}
          disabled={selectedIds.length < 1 || isSaving}
        >
          <span>{t('locations.save_button')}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <div className="info-note">{t('locations.info_note')}</div>
      </div>
    </div>
  );
}
