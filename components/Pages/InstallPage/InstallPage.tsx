'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './InstallPage.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser } from '@/contexts/UserContext';

type OSKey = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'tvos' | 'androidtv';

type AppOption = {
  id: string;
  name: string;
  descriptionKey: string;
  icon: string;
  recommended?: boolean;
};

type OSOption = {
  id: OSKey;
  name: string;
  descriptionKey: string;
  icon: React.ReactNode;
};

const AppleIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 16.97 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
  </svg>
);

const AndroidIcon = (
  <svg viewBox="-146 129 218 256" fill="currentColor">
    <path d="M-2.9,150.4l2.8-4.2l2.8-4.1l6.2-9.3c0.8-1.1,0.5-2.7-0.7-3.4c-1.1-0.8-2.7-0.5-3.4,0.7l-6.6,9.9l-2.8,4.2l-2.8,4.2c-9-3.5-18.9-5.4-29.5-5.4c-10.5,0-20.5,1.9-29.5,5.4l-2.8-4.2L-72,140l-6.6-9.9c-0.8-1.1-2.3-1.4-3.4-0.7c-1.1,0.8-1.4,2.3-0.7,3.4l6.2,9.3l2.8,4.1l2.8,4.2c-21,9.8-35.3,28.3-35.3,49.6H32.5C32.4,178.7,18.2,160.2-2.9,150.4zM-66.7,180.1c-4.1,0-7.4-3.3-7.4-7.4c0-4.1,3.3-7.4,7.4-7.4c4.1,0,7.4,3.3,7.4,7.4S-62.6,180.1-66.7,180.1z M-7.3,180.1c-4.1,0-7.4-3.3-7.4-7.4c0-4.1,3.3-7.4,7.4-7.4c4.1,0,7.4,3.3,7.4,7.4C0.2,176.8-3.1,180.1-7.3,180.1z"/>
    <path d="M-105.3,209.8l-1.1,0.1v12.3v10.1v86.6c0,8.7,7,15.7,15.7,15.7h11.3c-0.4,1.3-0.6,2.7-0.6,4.1v0.8v5v25.6c0,8.2,6.7,14.9,14.9,14.9s14.9-6.7,14.9-14.9v-25.6v-5v-0.8c0-1.4-0.2-2.8-0.6-4.1h27.6c-0.4,1.3-0.6,2.7-0.6,4.1v0.8v5v25.6c0,8.2,6.7,14.9,14.9,14.9c8.2,0,14.9-6.7,14.9-14.9v-25.6v-5v-0.8c0-1.4-0.2-2.8-0.6-4.1h11.3c8.7,0,15.7-7,15.7-15.7v-86.6v-10.1v-12.4h-1.1H-105.3z"/>
    <path d="M-131.1,209.9c-8.2,0-14.9,6.7-14.9,14.9v63.6c0,8.2,6.7,14.9,14.9,14.9c8.2,0,14.9-6.7,14.9-14.9v-63.6C-116.3,216.5-122.9,209.9-131.1,209.9z"/>
    <path d="M57.2,209.9c-8.2,0-14.9,6.7-14.9,14.9v63.6c0,8.2,6.7,14.9,14.9,14.9s14.9-6.7,14.9-14.9v-63.6C72,216.5,65.4,209.9,57.2,209.9z"/>
  </svg>
);

const WindowsIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 5.5L10.5 4.5V11.5H3V5.5Z"/>
    <path d="M12.5 4.25L21 3V11.5H12.5V4.25Z"/>
    <path d="M3 13.5H10.5V20.5L3 19.5V13.5Z"/>
    <path d="M12.5 13.5H21V22L12.5 20.75V13.5Z"/>
  </svg>
);

const LinuxIcon = (
  <svg viewBox="0 0 14 14" fill="currentColor">
    <path d="m 7.251794,0.99999832 c -0.077494,0 -0.1574887,0.004 -0.2394828,0.0105 -2.1133484,0.166488 -1.5528886,2.403328 -1.5848863,3.148775 -0.038497,0.54646 -0.1499893,0.97693 -0.5254624,1.510391 -0.4424682,0.525463 -1.0634237,1.374902 -1.3579026,2.260338 -0.13899,0.41597 -0.2049853,0.84194 -0.1434897,1.244411 -0.019499,0.017 -0.037997,0.034 -0.055496,0.0675 -0.1299907,0.13399 -0.2244839,0.300479 -0.3309763,0.41947 -0.099493,0.09949 -0.2424826,0.13349 -0.3984714,0.199986 -0.1564888,0.06799 -0.3289764,0.13449 -0.431969,0.3404747 -0.044997,0.09399 -0.067995,0.196486 -0.065995,0.300479 0,0.09949 0.013499,0.200485 0.027498,0.26798 0.028998,0.199486 0.057996,0.364474 0.019499,0.484966 -0.1239911,0.339975 -0.13949,0.572959 -0.052496,0.742446 0.086994,0.166988 0.2674808,0.234484 0.4694663,0.300479 0.405471,0.09999 0.9549316,0.06749 1.3874005,0.299478 0.4629668,0.233484 0.9329331,0.335476 1.3079063,0.234984 0.2629811,-0.0575 0.4849652,-0.231484 0.6039566,-0.472467 0.293479,-0.0015 0.6149559,-0.13449 1.129919,-0.166988 0.3494749,-0.029 0.7869436,0.133491 1.2889076,0.09949 0.012499,0.0675 0.031498,0.09949 0.056996,0.166988 l 0.0015,0.0015 c 0.195486,0.388972 0.5564601,0.56596 0.9419324,0.535462 0.3854724,-0.03 0.7959428,-0.267981 1.1284188,-0.652953 0.315477,-0.382473 0.84144,-0.541962 1.188915,-0.751446 0.173987,-0.09949 0.314477,-0.234484 0.324476,-0.42647 0.0115,-0.199986 -0.09949,-0.405971 -0.356974,-0.688451 l 0,-0.0485 -0.0015,-0.0015 c -0.08499,-0.09999 -0.124991,-0.267481 -0.168988,-0.4629667 -0.0425,-0.200485 -0.09099,-0.392972 -0.245982,-0.522962 l -0.0015,0 c -0.0295,-0.027 -0.0615,-0.0335 -0.09399,-0.0675 -0.028,-0.019 -0.0605,-0.031 -0.09499,-0.032 0.215484,-0.638954 0.13199,-1.274909 -0.08649,-1.846868 C 10.625052,6.7900833 10.159085,6.1761273 9.804111,5.7536573 9.4061395,5.2511933 9.0161675,4.7752273 9.023667,4.0692783 9.037166,2.9933553 9.1421585,1.0029983 7.251794,0.99999832 Z"/>
  </svg>
);

const OS_OPTIONS: OSOption[] = [
  { id: 'ios', name: 'iOS', descriptionKey: 'setup.ios_desc', icon: AppleIcon },
  { id: 'android', name: 'Android', descriptionKey: 'setup.android_desc', icon: AndroidIcon },
  { id: 'windows', name: 'Windows', descriptionKey: 'setup.windows_desc', icon: WindowsIcon },
  { id: 'macos', name: 'macOS', descriptionKey: 'setup.macos_desc', icon: AppleIcon },
  { id: 'linux', name: 'Linux', descriptionKey: 'setup.linux_desc', icon: LinuxIcon },
  { id: 'tvos', name: 'Apple TV', descriptionKey: 'setup.tvos_desc', icon: AppleIcon },
  { id: 'androidtv', name: 'Android TV', descriptionKey: 'setup.androidtv_desc', icon: AndroidIcon },
];

const APPS_BY_OS: Record<OSKey, AppOption[]> = {
  ios: [
    { id: 'happ', name: 'Happ', descriptionKey: 'setup.app_simple', icon: '/resources/img/happ.png', recommended: true },
    { id: 'karing', name: 'Karing', descriptionKey: 'setup.app_singbox', icon: '/resources/img/karing.png' },
    { id: 'v2raytun', name: 'v2RayTun', descriptionKey: 'setup.app_backup', icon: '/resources/img/v2.png' },
  ],
  android: [
    { id: 'happ', name: 'Happ', descriptionKey: 'setup.app_simple', icon: '/resources/img/happ.png', recommended: true },
    { id: 'karing', name: 'Karing', descriptionKey: 'setup.app_singbox', icon: '/resources/img/karing.png' },
    { id: 'v2raytun', name: 'v2RayTun', descriptionKey: 'setup.app_backup', icon: '/resources/img/v2.png' },
  ],
  windows: [
    { id: 'happ', name: 'Happ', descriptionKey: 'setup.app_simple', icon: '/resources/img/happ.png', recommended: true },
    { id: 'karing', name: 'Karing', descriptionKey: 'setup.app_singbox', icon: '/resources/img/karing.png' },
  ],
  macos: [
    { id: 'happ', name: 'Happ', descriptionKey: 'setup.app_native_mac', icon: '/resources/img/happ.png', recommended: true },
    { id: 'karing', name: 'Karing', descriptionKey: 'setup.app_singbox', icon: '/resources/img/karing.png' },
  ],
  linux: [],
  tvos: [],
  androidtv: [],
};

const DOWNLOAD_LINKS: Record<OSKey, Record<string, string>> = {
  ios: {
    happ: 'https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973',
    karing: 'https://apps.apple.com/ru/app/karing/id6472431552',
    v2raytun: 'https://apps.apple.com/ru/app/v2raytun/id6476628951',
  },
  android: {
    happ: 'https://play.google.com/store/apps/details?id=com.happproxy',
    karing: 'https://github.com/KaringX/karing/releases/download/v1.2.9.1210/karing_1.2.9.1210_android_arm.apk',
    v2raytun: 'https://play.google.com/store/apps/details?id=com.v2raytun.android&hl=ru',
  },
  windows: {
    happ: 'https://github.com/Happ-proxy/happ-desktop/releases/latest/download/setup-Happ.x64.exe',
    karing: 'https://github.com/KaringX/karing/releases/download/v1.2.9.1210/karing_1.2.9.1210_windows_x64.exe',
  },
  macos: {
    happ: 'https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973',
    karing: 'https://apps.apple.com/ru/app/karing/id6472431552',
  },
  linux: {},
  tvos: {},
  androidtv: {},
};

const GITBOOK_LINKS: Partial<Record<OSKey, string>> = {
  tvos: 'https://dochub.run/apple-tv/happ/setup',
  androidtv: 'https://dochub.run/android-tv/happ/setup',
  linux: 'https://dochub.run/linux/happ/setup',
};

const DEEP_LINK_PREFIXES: Record<string, string> = {
  happ: 'happ://add/',
  karing: 'karing://install-config?url=',
  v2raytun: 'v2raytun://import/',
};

const OS_DISPLAY_NAMES: Record<OSKey, string> = {
  ios: 'iOS',
  android: 'Android',
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  tvos: 'Apple TV',
  androidtv: 'Android TV',
};

interface InstallPageProps {
  onBack?: () => void;
}

export default function InstallPage({ onBack }: InstallPageProps) {
  const { t } = useLanguage();
  const { user, isLoading, error, isAuthenticated } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOS, setSelectedOS] = useState<OSKey | null>(null);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const stepTimerRef = useRef<number | null>(null);

  const subscriptionUrl =
    user?.account?.ru_subscription_url || user?.account?.global_subscription_url || '';

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => () => {
    if (stepTimerRef.current) {
      window.clearTimeout(stepTimerRef.current);
    }
  }, []);

  const showToast = (message: string) => {
    setToast(message);
  };

  const handleSelectOS = (os: OSKey) => {
    setSelectedOS(os);
    setSelectedApp(null);
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
    if (stepTimerRef.current) {
      window.clearTimeout(stepTimerRef.current);
    }
    stepTimerRef.current = window.setTimeout(() => {
      setCurrentStep(2);
    }, 300);
  };

  const handleSelectApp = (appId: string) => {
    setSelectedApp(appId);
  };

  const canNavigateToStep = (step: number) => step <= currentStep;

  const handleProgressClick = (step: number) => {
    if (!canNavigateToStep(step) || step === currentStep) {
      return;
    }
    if (step > 1 && !selectedOS) {
      return;
    }
    goToStep(step);
  };

  const goToStep = (step: number) => {
    if (step === 3 && selectedOS && !selectedApp) {
      const recommended = APPS_BY_OS[selectedOS].find((app) => app.recommended);
      if (recommended) {
        setSelectedApp(recommended.id);
      }
    }
    setCurrentStep(step);
  };

  const handleCopySubscription = async () => {
    if (!subscriptionUrl) {
      showToast(t('toast.link_loading'));
      return;
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(subscriptionUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = subscriptionUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast(t('toast.link_copied'));
    } catch {
      showToast(t('toast.link_copied'));
    }
  };

  const handleAddSubscription = () => {
    window.setTimeout(() => {
      setCurrentStep(4);
    }, 500);
  };

  const handleFinish = () => {
    if (onBack) {
      onBack();
      return;
    }
    setCurrentStep(1);
    setSelectedOS(null);
    setSelectedApp(null);
  };

  const handleSupport = () => {
    window.open('https://t.me/opengater_support', '_blank', 'noopener,noreferrer');
  };

  const selectedApps = selectedOS ? APPS_BY_OS[selectedOS] : [];
  const selectedAppInfo = selectedApps.find((app) => app.id === selectedApp) || null;
  const hasApps = selectedApps.length > 0;

  const downloadLink = selectedOS && selectedApp
    ? DOWNLOAD_LINKS[selectedOS]?.[selectedApp]
    : '';

  const osName = selectedOS ? OS_DISPLAY_NAMES[selectedOS] : '';
  const downloadSubtitle = selectedAppInfo
    ? t('setup.app_for', { app: selectedAppInfo.name, os: osName })
    : t('setup.download_desc');

  const addSubscriptionLink = useMemo(() => {
    if (!subscriptionUrl || !selectedApp) return '';
    const prefix = DEEP_LINK_PREFIXES[selectedApp];
    if (!prefix) return '';
    if (selectedApp === 'karing') {
      return `${prefix}${encodeURIComponent(subscriptionUrl)}`;
    }
    return `${prefix}${subscriptionUrl}`;
  }, [selectedApp, subscriptionUrl]);

  if (isLoading) {
    return (
      <div className="install-page loading">
        <div className="loading-container">
          <span className="loading-spinner"></span>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="install-page">
        <div className="error-container">
          <p style={{ color: 'red' }}>{t('common.error_prefix')}: {error}</p>
          <p>{t('common.check_token')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="install-page">
        <div className="auth-required">
          <p>{t('common.auth_required')}</p>
          <p>{t('common.add_token')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="install-page">
      <header className="install-mobile-header">
        <button className="back-button" onClick={handleFinish}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" />
          </svg>
        </button>
        <div className="header-title">{t('setup.header_title')}</div>
        <div className="header-spacer"></div>
      </header>

      <div className="progress-container">
        <div className="progress-steps">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`progress-step ${step < currentStep ? 'completed' : step === currentStep ? 'active' : ''} ${canNavigateToStep(step) ? 'clickable' : ''}`}
              role="button"
              tabIndex={canNavigateToStep(step) ? 0 : -1}
              aria-label={`Step ${step}`}
              aria-current={step === currentStep ? 'step' : undefined}
              onClick={() => handleProgressClick(step)}
              onKeyDown={(event) => {
                if (!canNavigateToStep(step)) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleProgressClick(step);
                }
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className={`step ${currentStep === 1 ? 'active' : ''}`} id="step-1">
        <div className="step-content">
          <div className="step-section">
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12" y2="18"></line>
              </svg>
            </div>
            <h2 className="step-title">{t('setup.os_title')}</h2>
            <p className="step-subtitle">{t('setup.os_subtitle')}</p>
          </div>

          <div className="options-grid">
            {OS_OPTIONS.map((option) => (
              <div
                key={option.id}
                className={`option-card ${selectedOS === option.id ? 'selected' : ''}`}
                onClick={() => handleSelectOS(option.id)}
              >
                <div className="option-icon">{option.icon}</div>
                <div className="option-info">
                  <div className="option-name">{option.name}</div>
                  <div className="option-description">{t(option.descriptionKey)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`step ${currentStep === 2 ? 'active' : ''}`} id="step-2">
        <div className="step-content">
          <div className="step-section">
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="15"></line>
                <line x1="15" y1="9" x2="9" y2="15"></line>
              </svg>
            </div>
            <h2 className="step-title">{t('setup.app_title')}</h2>
            <p className="step-subtitle">{t('setup.app_subtitle')}</p>
          </div>

          <div className="options-grid" id="app-list">
            {selectedOS && !hasApps ? (
              <div className="instructions-card">
                <div className="instructions-icon">??</div>
                <h3>{t('setup.instructions_available')}</h3>
                <p>{t('setup.instructions_for', { os: OS_DISPLAY_NAMES[selectedOS] })}</p>
                {GITBOOK_LINKS[selectedOS] && (
                  <a
                    href={GITBOOK_LINKS[selectedOS]}
                    target="_blank"
                    rel="noreferrer"
                    className="continue-button"
                  >
                    {t('setup.go_to_instructions')}
                  </a>
                )}
              </div>
            ) : (
              selectedApps.map((app) => (
                <div
                  key={app.id}
                  className={`option-card ${selectedApp === app.id ? 'selected' : ''}`}
                  onClick={() => handleSelectApp(app.id)}
                >
                  <div className="option-icon">
                    <img src={app.icon} alt={app.name} />
                  </div>
                  <div className="option-info">
                    <div className="option-name">{app.name}</div>
                    <div className="option-description">{t(app.descriptionKey)}</div>
                  </div>
                  {app.recommended && (
                    <span className="option-badge">{t('setup.recommended')}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {selectedOS && hasApps && (
          <div className="bottom-actions">
            <button
              className="continue-button"
              onClick={() => goToStep(3)}
              disabled={!selectedApp}
            >
              <span>{t('setup.continue')}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className={`step ${currentStep === 3 ? 'active' : ''}`} id="step-3">
        <div className="step-content">
          <div className="step-section">
            <div className="step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <h2 className="step-title">{t('setup.install_title')}</h2>
            <p className="step-subtitle">{t('setup.install_subtitle')}</p>
          </div>

          <div className="install-section">
            <span className="install-step-number">1</span>
            <h3 className="install-step-title">{t('setup.download_app')}</h3>
            <p className="install-step-description" id="download-subtitle">{downloadSubtitle}</p>
            <a
              id="download-button-link"
              className="download-button"
              href={downloadLink || '#'}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                if (!downloadLink) {
                  event.preventDefault();
                }
              }}
              aria-disabled={!downloadLink}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>{t('setup.download')}</span>
            </a>
          </div>

          <div className="install-section">
            <span className="install-step-number">2</span>
            <h3 className="install-step-title">{t('setup.add_subscription')}</h3>
            <p className="install-step-description">{t('setup.subscription_desc')}</p>

            <div
              className="subscription-code"
              onClick={handleCopySubscription}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  handleCopySubscription();
                }
              }}
            >
              {subscriptionUrl ? subscriptionUrl : <span className="loading-spinner"></span>}
            </div>
            <p className="copy-hint">{t('setup.copy_hint')}</p>

            <div id="add-subscription-wrapper">
              {addSubscriptionLink ? (
                <a
                  href={addSubscriptionLink}
                  target="_blank"
                  rel="noreferrer"
                  className="download-button"
                  onClick={handleAddSubscription}
                >
                  {t('setup.add_button')}
                </a>
              ) : (
                <button className="download-button" disabled>
                  {t('setup.add_button')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`step ${currentStep === 4 ? 'active' : ''}`} id="step-4">
        <div className="step-content">
          <div className="success-container">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="success-title">{t('setup.success_title')}</h2>
            <p
              className="success-message"
              dangerouslySetInnerHTML={{ __html: t('setup.success_message') }}
            ></p>
          </div>

          <div className="help-card">
            <h3 className="help-title">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
              </svg>
              <span>{t('setup.need_help')}</span>
            </h3>
            <p className="help-text">{t('setup.help_text')}</p>
          </div>
        </div>

        <div className="bottom-actions">
          <button className="continue-button" onClick={handleFinish}>
            <span>{t('setup.finish')}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <button className="support-button" onClick={handleSupport}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{t('setup.contact_support')}</span>
          </button>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
