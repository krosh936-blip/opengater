'use client'
import React, { useEffect, useMemo, useState } from 'react';
import './DevicesPage.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser } from '@/contexts/UserContext';
import { fetchDeviceButtons, fetchDeviceTariff, setDeviceNumber, DeviceButtonOption, DeviceTariff, DeviceTariffResponse } from '@/lib/api';

interface DevicesPageProps {
  onBack?: () => void;
}

const planLabelByDevice: Record<number, string> = {
  2: 'devices.plan_starter',
  3: 'devices.plan_optimal',
  5: 'devices.plan_family',
  10: 'devices.plan_team',
};

export default function DevicesPage({ onBack }: DevicesPageProps) {
  const { t, language } = useLanguage();
  const { user, isLoading, error, isAuthenticated, refreshUser } = useUser();
  const [plans, setPlans] = useState<DeviceButtonOption[]>([]);
  const [selectedDeviceNumber, setSelectedDeviceNumber] = useState<number | null>(null);
  const [tariffs, setTariffs] = useState<Record<number, DeviceTariff>>({});
  const [customValue, setCustomValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const formatCurrency = (value: number) => `${Math.round(Number(value) || 0)}₽`;
  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.device_number - b.device_number),
    [plans]
  );
  const fallbackPlanNumbers = [2, 3, 5, 10];
  const planNumbers = useMemo(() => {
    if (sortedPlans.length) {
      return sortedPlans.map((plan) => plan.device_number);
    }
    return fallbackPlanNumbers;
  }, [sortedPlans]);

  const renderPlanIcon = (deviceNumber: number) => {
    switch (deviceNumber) {
      case 2:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12" y2="18"></line>
          </svg>
        );
      case 3:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <path d="M12 2v20M5 5h14M5 9h14"></path>
          </svg>
        );
      case 5:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        );
      case 10:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M12 3v4M8 3v4M16 3v4"></path>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12" y2="18"></line>
          </svg>
        );
    }
  };

  const deviceLabel = (count: number) => {
    if (language === 'en') return count === 1 ? t('devices.device_single') : t('devices.devices_plural');
    const last = count % 10;
    const lastTwo = count % 100;
    if (lastTwo < 11 || lastTwo > 14) {
      if (last === 1) return t('devices.device_one');
      if (last >= 2 && last <= 4) return t('devices.device_few');
    }
    return t('devices.devices_plural');
  };

  useEffect(() => {
    let mounted = true;
    const loadPlans = async () => {
      if (!user?.id) return;
      try {
        const data = await fetchDeviceButtons(user.id);
        if (!mounted) return;
        setPlans(Array.isArray(data) ? data : []);
        const selected =
          data.find((item) => item.selected)?.device_number ||
          user.device_number ||
          fallbackPlanNumbers[0];
        setSelectedDeviceNumber(selected);
      } catch {
        if (mounted) {
          setPlans([]);
          setSelectedDeviceNumber(user?.device_number || fallbackPlanNumbers[0]);
        }
      }
    };
    loadPlans();
    return () => {
      mounted = false;
    };
  }, [user?.id, user?.device_number]);

  useEffect(() => {
    let mounted = true;
    const loadTariffs = async () => {
      if (!user?.id || !planNumbers.length) return;
      const deviceNumbers = Array.from(new Set(planNumbers));
      const results = await Promise.all(
        deviceNumbers.map(async (num) => {
          try {
        const data = await fetchDeviceTariff(user.id, num);
        return [num, data] as const;
      } catch {
        return null;
      }
    })
  );
      if (!mounted) return;
      const next: Record<number, DeviceTariff> = {};
      results.forEach((item) => {
        if (item) {
          const [num, data] = item;
          const normalized: DeviceTariff =
            typeof data === 'number'
              ? { device_number: num, tariff_per_day: 0, tariff_per_month: Number(data) }
              : {
                  device_number: data.device_number ?? num,
                  tariff_per_day: Number(data.tariff_per_day),
                  tariff_per_month: Number(data.tariff_per_month),
                };
          next[num] = normalized;
        }
      });
      setTariffs(next);
    };
    loadTariffs();
    return () => {
      mounted = false;
    };
  }, [planNumbers, user?.id]);

  useEffect(() => {
    if (!user?.id || selectedDeviceNumber == null) return;
    if (tariffs[selectedDeviceNumber]) return;
    let mounted = true;
    fetchDeviceTariff(user.id, selectedDeviceNumber)
      .then((data) => {
        if (mounted) {
          const normalized: DeviceTariff =
            typeof data === 'number'
              ? { device_number: selectedDeviceNumber, tariff_per_day: 0, tariff_per_month: Number(data) }
              : {
                  device_number: data.device_number ?? selectedDeviceNumber,
                  tariff_per_day: Number(data.tariff_per_day),
                  tariff_per_month: Number(data.tariff_per_month),
                };
          setTariffs((prev) => ({
            ...prev,
            [selectedDeviceNumber]: {
              ...normalized,
            },
          }));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [selectedDeviceNumber, user?.id, tariffs]);

  useEffect(() => {
    if (!user?.id || !user?.device_number) return;
    if (tariffs[user.device_number]) return;
    let mounted = true;
    fetchDeviceTariff(user.id, user.device_number)
      .then((data) => {
        if (!mounted) return;
        const normalized: DeviceTariff =
          typeof data === 'number'
            ? { device_number: user.device_number, tariff_per_day: 0, tariff_per_month: Number(data) }
            : {
                device_number: data.device_number ?? user.device_number,
                tariff_per_day: Number(data.tariff_per_day),
                tariff_per_month: Number(data.tariff_per_month),
              };
        setTariffs((prev) => ({
          ...prev,
          [user.device_number as number]: normalized,
        }));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [user?.id, user?.device_number, tariffs]);

  const currentTariff = useMemo(() => {
    if (selectedDeviceNumber == null) return null;
    if (tariffs[selectedDeviceNumber]) return tariffs[selectedDeviceNumber];
    if (user?.device_number && tariffs[user.device_number]) return tariffs[user.device_number];
    return null;
  }, [selectedDeviceNumber, tariffs, user?.device_number]);

  const discountPercent = 0;
  const discountValue = 0;

  const handleSelectPlan = (deviceNumber: number) => {
    setSelectedDeviceNumber(deviceNumber);
    setCustomValue('');
  };

  const handleCustomInput = (value: string) => {
    setCustomValue(value);
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 2) {
      setSelectedDeviceNumber(parsed);
    }
  };

  const handleUpdate = async () => {
    if (!user?.id || selectedDeviceNumber == null) return;
    setIsUpdating(true);
    try {
      await setDeviceNumber(user.id, selectedDeviceNumber);
      await refreshUser();
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="devices-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="devices-page">
        <div className="error-container">
          <p style={{ color: 'red' }}>{t('common.error_prefix')}: {error}</p>
          <p>{t('common.check_token')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="devices-page">
        <div className="auth-required">
          <p>{t('common.auth_required')}</p>
          <p>{t('common.add_token')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="devices-page">
      <header className="devices-mobile-header">
        <button className="back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12L12 19M5 12L12 5"></path>
          </svg>
        </button>
        <div className="header-title">{t('devices.page_title')}</div>
        <div className="header-spacer"></div>
      </header>

      <div className="hero-section">
        <div className="hero-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <circle cx="12" cy="18" r="1"></circle>
          </svg>
        </div>
        <h1 className="hero-title">{t('devices.hero_title')}</h1>
        <p className="hero-subtitle">{t('devices.hero_subtitle')}</p>
      </div>

      <div className="current-status">
        <div className="status-header">
          <div className="status-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="6" width="16" height="12" rx="2"></rect>
              <circle cx="8" cy="12" r="1"></circle>
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="16" cy="12" r="1"></circle>
            </svg>
          </div>
          <span className="status-label">{t('devices.current_tariff')}</span>
        </div>
        <div className="status-content">
          <span className="status-devices">
            {selectedDeviceNumber ?? user?.device_number ?? 0} {deviceLabel(selectedDeviceNumber ?? user?.device_number ?? 0)}
          </span>
          <div className="status-price">
            <div className="price-value">
              {currentTariff && Number.isFinite(Number(currentTariff.tariff_per_month))
                ? formatCurrency(currentTariff.tariff_per_month)
                : '...'}
            </div>
            <div className="price-period">{t('devices.per_month')}</div>
          </div>
        </div>
      </div>

      <div className="plans-grid">
        {(sortedPlans.length ? sortedPlans : fallbackPlanNumbers.map((num) => ({
          device_number: num,
          text: String(num),
          selected: num === selectedDeviceNumber,
        }))).map((plan) => {
          const price = tariffs[plan.device_number]?.tariff_per_month;
          const isActive = selectedDeviceNumber === plan.device_number;
          const labelKey = planLabelByDevice[plan.device_number] || 'devices.plan_custom';
          const isPopular = plan.device_number === 3;
          return (
            <div
              key={plan.device_number}
              className={`plan-card ${isActive ? 'selected' : ''} ${isPopular ? 'popular' : ''}`}
              onClick={() => handleSelectPlan(plan.device_number)}
            >
              {isPopular && <span className="plan-badge">{t('devices.popular')}</span>}
              <div className="plan-content">
                <div className="plan-header">
                  <div className="plan-icon">
                    {renderPlanIcon(plan.device_number)}
                  </div>
                  <h3 className="plan-title">{t(labelKey)}</h3>
                  <p className="plan-devices">
                    {plan.device_number} {deviceLabel(plan.device_number)}
                  </p>
                </div>
                <div className="plan-footer">
                  <span className="plan-price">{price ? formatCurrency(price) : '...'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="custom-section">
        <label className="custom-label">{t('devices.custom_label')}</label>
        <input
          type="number"
          className="custom-input"
          placeholder={t('devices.custom_placeholder')}
          min={2}
          max={100}
          value={customValue}
          onChange={(event) => handleCustomInput(event.target.value)}
        />
      </div>

      <div className="pricing-summary">
        <div className="pricing-title">{t('devices.pricing_title')}</div>
        <div className="pricing-row">
          <span className="pricing-label">{t('devices.selected_devices')}</span>
          <span className="pricing-value">{selectedDeviceNumber ?? '-'}</span>
        </div>
        <div className="pricing-row" style={{ display: discountPercent ? 'flex' : 'none' }}>
          <span className="pricing-label">{t('devices.discount_28')}</span>
          <span className="pricing-value pricing-savings">-{formatCurrency(discountValue)}</span>
        </div>
        <div className="pricing-row">
          <span className="pricing-label pricing-total-label">{t('devices.total_monthly')}</span>
          <span className="pricing-value pricing-total">
            {currentTariff && Number.isFinite(Number(currentTariff.tariff_per_month))
              ? formatCurrency(currentTariff.tariff_per_month)
              : '...'}
          </span>
        </div>
      </div>

      <div className="bottom-actions">
        <button className="action-button" onClick={handleUpdate} disabled={isUpdating || selectedDeviceNumber == null}>
          <span>{t('devices.update_button')}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <div className="info-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span>{t('devices.info_privacy')}</span> • <a href="#" className="info-link">{t('devices.info_how_works')}</a>
        </div>
      </div>
    </div>
  );
}
