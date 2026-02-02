'use client'
import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import './AuthPage.css';
import { authUserById, createAuthUserFromTelegram, setUserToken, TelegramAuthPayload } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthPayload) => void;
  }
}

export default function LoginPage() {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenSubmitting, setIsTokenSubmitting] = useState(false);

  useEffect(() => {
    window.onTelegramAuth = async (user) => {
      try {
        setError('');
        const token = await createAuthUserFromTelegram(user);
        setUserToken(token);
        window.location.href = '/';
      } catch (e) {
        setError(t('auth.telegram_error'));
      }
    };
  }, [t]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const userId = Number(username);
      if (!Number.isFinite(userId)) {
        setError(t('auth.username_id_hint'));
        return;
      }
      const token = await authUserById(userId);
      setUserToken(token);
      window.location.href = '/';
    } catch {
      setError(t('auth.login_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTokenLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsTokenSubmitting(true);
    const token = tokenInput.trim();
    if (!token) {
      setError(t('auth.token_required'));
      setIsTokenSubmitting(false);
      return;
    }
    setUserToken(token);
    window.location.href = '/';
  };

  return (
    <div className="auth-page">
      <div className="main">
        <div className="header-controls">
          <button
            className="back-button"
            onClick={() => {
              try {
                window.location.href = window.location.origin + '/';
              } catch {
                window.location.href = '/';
              }
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </button>
        </div>

        <div className="container">
          <div className="auth-card">
            <div className="logo-section">
              <div className="logo">
                <img src="/logo.png" alt="Opengater" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
              <h1 className="auth-title">{t('auth.title')}</h1>
              <p className="auth-subtitle">{t('auth.subtitle')}</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form id="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="username">{t('auth.username')}</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="form-input"
                  placeholder={t('auth.username_placeholder')}
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">{t('auth.password')}</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-input"
                  placeholder={t('auth.password_placeholder')}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="button button-primary" disabled={isSubmitting}>
                  <span className="button-text">{isSubmitting ? t('auth.signing_in') : t('auth.sign_in')}</span>
                  <div className={`loading-spinner ${isSubmitting ? 'visible' : ''}`}></div>
                </button>
              </div>
            </form>

            <div className="divider">
              <div className="divider-line"></div>
              <span className="divider-text">{t('auth.or')}</span>
              <div className="divider-line"></div>
            </div>

            <form id="token-form" onSubmit={handleTokenLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="token-input">{t('auth.token')}</label>
                <input
                  type="text"
                  id="token-input"
                  name="token"
                  className="form-input"
                  placeholder={t('auth.token_placeholder')}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="button button-primary" disabled={isTokenSubmitting}>
                  <span className="button-text">
                    {isTokenSubmitting ? t('auth.signing_in') : t('auth.use_token')}
                  </span>
                  <div className={`loading-spinner ${isTokenSubmitting ? 'visible' : ''}`}></div>
                </button>
              </div>
            </form>

            <div className="telegram-login-container">
              <div id="telegram-login-widget"></div>
            </div>

            <div className="auth-footer">
              <p className="auth-footer-text">
                <span>{t('auth.no_account')}</span>
                <a href="/auth/register" className="auth-footer-link">{t('auth.register')}</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Script
        src="https://telegram.org/js/telegram-widget.js?22"
        strategy="afterInteractive"
        data-telegram-login="opengater_vpn_bot"
        data-size="large"
        data-radius="12"
        data-onauth="onTelegramAuth(user)"
        data-request-access="write"
        onLoad={() => {
          const widget = document.getElementById('telegram-login-widget');
          if (widget && !widget.querySelector('script')) {
            // Widget script uses data-* on script tag; injecting here is enough.
          }
        }}
      />
    </div>
  );
}
