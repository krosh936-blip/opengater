'use client'
import React, { useEffect, useState } from 'react';
import './AuthPage.css';
import {
  authUserById,
  type AuthTokens,
  type AuthUserProfile,
  extractAuthToken,
  fetchAuthProfile,
  fetchAuthUserId,
  fetchUserInfoByToken,
  getUserToken,
  refreshAuthToken,
  removeUserToken,
  sendEmailAuthCode,
  setUserToken,
  type UserInfo,
  verifyAuthToken,
  verifyEmailAuthCode,
} from '@/lib/api';
import { AUTH_POPUP_ORIGIN, SERVICE_NAME, TELEGRAM_BOT_USERNAME, TELEGRAM_OAUTH_URL } from '@/lib/appConfig';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoginPage() {
  const { t, language } = useLanguage();
  const [emailInput, setEmailInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [showQuickLogin, setShowQuickLogin] = useState(false);
  const [quickLoginLabel, setQuickLoginLabel] = useState('');
  const [quickLoginSecondary, setQuickLoginSecondary] = useState('');
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);

  const authLanguage = language === 'am' ? 'hy' : language;
  const titleText = step === 'code' ? t('auth.email_code_title') : t('auth.welcome_title');
  const subtitleText = step === 'code'
    ? t('auth.email_code_subtitle', { email: pendingEmail || emailInput })
    : t('auth.welcome_subtitle');
  const emailLabel = t('auth.email_label');
  const submitText = t('auth.continue');
  const dividerText = t('auth.or');
  const telegramText = t('auth.telegram_continue');
  const tokenToggleText = t('auth.use_token');
  const tokenPlaceholder = t('auth.token_placeholder');
  const tokenButtonText = t('auth.token_button');
  const quickContinueAs = t('auth.continue_as');
  const quickOtherAccount = t('auth.login_other_account');
  const quickAccountLabel = t('auth.quick_account');

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => {
      setResendIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const prevRootTheme = root.getAttribute('data-theme');
    const prevBodyTheme = body.getAttribute('data-theme');
    const hadAuthClass = body.classList.contains('auth-page');

    root.setAttribute('data-theme', 'light');
    body.setAttribute('data-theme', 'light');
    body.classList.add('auth-page');

    return () => {
      if (prevRootTheme !== null) {
        root.setAttribute('data-theme', prevRootTheme);
      } else {
        root.removeAttribute('data-theme');
      }
      if (prevBodyTheme !== null) {
        body.setAttribute('data-theme', prevBodyTheme);
      } else {
        body.removeAttribute('data-theme');
      }
      if (!hadAuthClass) {
        body.classList.remove('auth-page');
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = getUserToken();
    if (!token) return;
    let mounted = true;
    fetchUserInfoByToken(token)
      .then(() => {
        if (!mounted) return;
        window.location.replace('/');
      })
      .catch((err) => {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : '';
        if (/недействительный токен|401|403/i.test(message)) {
          removeUserToken();
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const refreshToken = localStorage.getItem('auth_refresh_token') || localStorage.getItem('ga_refresh_token');
    if (!refreshToken) return;
    const storedLabel = localStorage.getItem('auth_user_label') || '';
    const storedFullName = localStorage.getItem('ga_user_fullname') || '';
    const storedEmail = localStorage.getItem('ga_user_email') || '';
    const storedSource = localStorage.getItem('auth_source');
    const normalizedFullName = normalizeLabel(storedFullName);
    const normalizedEmail =
      storedSource === 'telegram'
        ? normalizeTelegramLabel(storedEmail) || normalizeLabel(storedEmail)
        : normalizeLabel(storedEmail);
    const normalizedLabel =
      storedSource === 'telegram'
        ? normalizeTelegramLabel(storedLabel) || normalizeLabel(storedLabel)
        : normalizeLabel(storedLabel);
    const primary = normalizedFullName || normalizedLabel || normalizedEmail;
    const secondary =
      normalizedFullName && normalizedEmail && normalizedFullName !== normalizedEmail ? normalizedEmail : '';
    setQuickLoginLabel(primary || quickAccountLabel);
    setQuickLoginSecondary(secondary);
    setShowQuickLogin(true);
  }, [quickAccountLabel]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!showQuickLogin) return;
    if (quickLoginLabel && quickLoginLabel !== quickAccountLabel) return;
    const accessToken = localStorage.getItem('auth_access_token') || localStorage.getItem('access_token');
    if (!accessToken) return;
    const source =
      (localStorage.getItem('auth_source') as 'email' | 'telegram' | null) || 'email';
    let mounted = true;
    fetchAuthProfile(accessToken)
      .then((profile) => {
        if (!mounted || !profile) return;
        const { primary, secondary } = deriveAuthLabels(source, { profile });
        if (primary || secondary) {
          storeAuthUserLabels(primary, secondary);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [showQuickLogin, quickLoginLabel, quickAccountLabel]);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const normalizeLabel = (value?: string | null): string => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^\d+$/.test(trimmed)) return '';
    return trimmed;
  };

  const normalizeTelegramLabel = (value?: string | null): string => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    const normalized = trimmed.replace(/^@/, '');
    if (!normalized || /^\d+$/.test(normalized)) return '';
    const handleLike = /^(?=.*[a-zA-Z_])[a-zA-Z0-9_]{3,}$/.test(normalized);
    if (!handleLike) return '';
    return `@${normalized}`;
  };

  const storeAuthUserLabels = (primary: string, secondary?: string) => {
    if (typeof window === 'undefined') return;
    const normalizedPrimary = normalizeLabel(primary);
    const normalizedSecondary = normalizeLabel(secondary);
    if (normalizedPrimary) {
      localStorage.setItem('auth_user_label', normalizedPrimary);
    }
    if (normalizedPrimary || normalizedSecondary) {
      const value = normalizedPrimary || normalizedSecondary;
      if (normalizedPrimary && normalizedSecondary && normalizedPrimary !== normalizedSecondary) {
        localStorage.setItem('ga_user_fullname', normalizedPrimary);
        localStorage.setItem('ga_user_email', normalizedSecondary);
      } else {
        localStorage.setItem('ga_user_fullname', value);
        localStorage.setItem('ga_user_email', value);
      }
      setQuickLoginLabel(value);
      const secondaryValue =
        normalizedPrimary && normalizedSecondary && normalizedPrimary !== normalizedSecondary ? normalizedSecondary : '';
      setQuickLoginSecondary(secondaryValue);
    }
  };

  const deriveAuthLabels = (
    source: 'email' | 'telegram',
    options: {
      hint?: string;
      profile?: AuthUserProfile | null;
      userInfo?: UserInfo | null;
    }
  ): { primary: string; secondary?: string } => {
    if (source === 'email') {
      const directEmail =
        normalizeLabel(options.hint) ||
        normalizeLabel(options.profile?.email) ||
        (options.userInfo?.username?.includes('@') ? normalizeLabel(options.userInfo.username) : '');
      const fallbackName = normalizeLabel(
        options.userInfo?.full_name ||
        options.profile?.fullName ||
        options.profile?.username ||
        options.profile?.telegram
      );
      const primary = directEmail || fallbackName;
      return { primary };
    }

    const tgUsername =
      normalizeTelegramLabel(options.profile?.telegramUsername) ||
      normalizeTelegramLabel(options.profile?.telegram) ||
      normalizeTelegramLabel(options.profile?.username) ||
      normalizeTelegramLabel(options.userInfo?.username);
    const fullName = normalizeLabel(options.profile?.fullName || options.userInfo?.full_name);
    const primary = fullName || tgUsername || normalizeLabel(options.profile?.email) || '';
    const secondary = fullName && tgUsername && fullName !== tgUsername ? tgUsername : '';
    return { primary, secondary };
  };

  const resolveAndStoreAuthLabel = async (
    accessToken: string,
    source: 'email' | 'telegram',
    hint?: string,
    userInfo?: UserInfo | null
  ) => {
    let profile: AuthUserProfile | null = null;
    try {
      profile = await fetchAuthProfile(accessToken);
    } catch {
      // Игнорируем ошибки, чтобы не ломать авторизацию.
    }
    const { primary, secondary } = deriveAuthLabels(source, { hint, profile, userInfo });
    if (primary || secondary) {
      storeAuthUserLabels(primary, secondary);
    }
  };

  const clearAuthTokens = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_source');
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user_label');
    localStorage.removeItem('ga_refresh_token');
    localStorage.removeItem('ga_user_email');
    localStorage.removeItem('ga_user_fullname');
  };

  const saveAuthTokens = (tokens: AuthTokens, source: 'email' | 'telegram') => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_access_token', tokens.access_token);
    localStorage.setItem('access_token', tokens.access_token);
    if (tokens.refresh_token) {
      localStorage.setItem('auth_refresh_token', tokens.refresh_token);
      localStorage.setItem('ga_refresh_token', tokens.refresh_token);
    }
    localStorage.setItem('auth_source', source);
  };

  const handleAuthTokens = async (tokens: AuthTokens, source: 'email' | 'telegram', labelHint?: string) => {
    if (!tokens.access_token) {
      throw new Error(t('auth.login_error'));
    }
    saveAuthTokens(tokens, source);
    await resolveAndStoreAuthLabel(tokens.access_token, source, labelHint, null);

    // Primary path: exchange auth access token into user token via user_id.
    let userId: number | null = decodeUserIdFromJwt(tokens.access_token);
    if (!userId) {
      try {
        const verificationData = await verifyAuthToken(tokens.access_token);
        userId = extractUserIdFromRecord(verificationData);
      } catch {
        userId = null;
      }
    }
    if (!userId) {
      try {
        userId = await fetchAuthUserId(tokens.access_token);
      } catch {
        userId = null;
      }
    }
    if (userId) {
      const token = await authUserById(userId);
      setUserToken(token);
      localStorage.setItem('user_id', String(userId));
      window.location.href = '/';
      return;
    }

    // Fallback: in some environments access_token is already a user token.
    let userInfo: UserInfo | null = null;
    try {
      userInfo = await fetchUserInfoByToken(tokens.access_token);
    } catch {
      userInfo = null;
    }
    if (!userInfo) {
      throw new Error(t('auth.login_error'));
    }
    setUserToken(tokens.access_token);
    if (userInfo.id) {
      localStorage.setItem('user_id', String(userInfo.id));
    }
    await resolveAndStoreAuthLabel(tokens.access_token, source, labelHint, userInfo);
    window.location.href = '/';
  };

  const openTelegramAuthPopup = () => {
    if (typeof window === 'undefined') return;
    setError('');

    const lang = authLanguage || 'ru';
    const storedTheme = localStorage.getItem('opengater-theme');
    const theme = storedTheme === 'light' ? 'light' : 'dark';
    const statePayload = { service_name: SERVICE_NAME };
    const encodedState = btoa(JSON.stringify(statePayload));
    const url = new URL(AUTH_POPUP_ORIGIN);
    url.searchParams.set('lang', lang);
    url.searchParams.set('theme', theme);
    url.searchParams.set('state', encodedState);

    const popup = window.open(
      url.toString(),
      'opengater_telegram_auth',
      'width=520,height=720,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes'
    );

    if (!popup) {
      setError(t('profile.popup_blocked'));
      if (TELEGRAM_OAUTH_URL) {
        window.open(TELEGRAM_OAUTH_URL, '_blank', 'noopener,noreferrer');
      } else {
        const bot = TELEGRAM_BOT_USERNAME.replace(/^@/, '');
        if (bot) {
          window.open(`https://t.me/${bot}`, '_blank', 'noopener,noreferrer');
        }
      }
      return;
    }

    const cleanup = (intervalId?: number) => {
      window.removeEventListener('message', onMessage);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };

  const handleTokensFromHash = async (hash: string) => {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const accessToken = params.get('access_token') || '';
      if (!accessToken) return;
      const refreshToken = params.get('refresh_token') || '';
      const tokenType = params.get('token_type') || '';
      await handleAuthTokens(
        { access_token: accessToken, refresh_token: refreshToken, token_type: tokenType },
        'telegram'
      );
  };

    const allowedOrigins = new Set([
      AUTH_POPUP_ORIGIN,
      'https://lka.bot.eutochkin.com',
      'https://auth.bot.lk.eutochkin.com',
    ]);

    const onMessage = (event: MessageEvent) => {
      if (!allowedOrigins.has(event.origin)) return;
      if (!event.data || typeof event.data !== 'object') return;
      const data = event.data as Partial<AuthTokens & { type?: string }>;
      if (data.type === 'auth_success' && data.access_token) {
        cleanup(pollTimer);
        handleAuthTokens(
          { access_token: data.access_token, refresh_token: data.refresh_token || '', token_type: data.token_type },
          'telegram'
        ).catch((err) => {
          setError(err instanceof Error ? err.message : t('auth.telegram_error'));
        });
        if (!popup.closed) popup.close();
      }
    };

    window.addEventListener('message', onMessage);

    const pollTimer = window.setInterval(() => {
      if (popup.closed) {
        cleanup(pollTimer);
        return;
      }
      try {
        const sameOrigin = popup.location.origin === window.location.origin;
        if (sameOrigin && popup.location.hash) {
          const hash = popup.location.hash;
          cleanup(pollTimer);
          handleTokensFromHash(hash)
            .catch((err) => {
              setError(err instanceof Error ? err.message : t('auth.telegram_error'));
            })
            .finally(() => {
              if (!popup.closed) popup.close();
            });
        }
      } catch {
        // Пока окно на другом домене — доступа нет.
      }
    }, 500);

  };

  const handleTokenLogin = () => {
    const value = tokenInput.trim();
    if (!value) {
      setError(t('auth.token_required'));
      return;
    }
    clearAuthTokens();
    setUserToken(value);
    window.location.href = '/';
  };

  const handleQuickLogin = async () => {
    if (typeof window === 'undefined') return;
    const refreshToken = localStorage.getItem('auth_refresh_token') || localStorage.getItem('ga_refresh_token');
    if (!refreshToken) {
      setShowQuickLogin(false);
      return;
    }
    setQuickLoginLoading(true);
    setError('');
    try {
      const source =
        (localStorage.getItem('auth_source') as 'email' | 'telegram' | null) || 'email';
      const accessToken = localStorage.getItem('auth_access_token') || localStorage.getItem('access_token') || '';
      if (accessToken) {
        try {
          const verification = await verifyAuthToken(accessToken);
          const isActive =
            typeof verification?.active === 'boolean' ? verification.active : true;
          if (isActive) {
            await handleAuthTokens(
              { access_token: accessToken, refresh_token: refreshToken, token_type: 'bearer' },
              source
            );
            return;
          }
        } catch {
          // Токен невалиден — пробуем обновить по refresh token.
        }
      }
      const tokens = await refreshAuthToken(refreshToken);
      await handleAuthTokens(tokens, source);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      const isAuthError = /401|403|invalid|unauthorized/i.test(message);
      clearAuthTokens();
      setShowQuickLogin(false);
      if (!isAuthError) {
        setError(message || t('auth.login_error'));
      }
    } finally {
      setQuickLoginLoading(false);
    }
  };

  const handleOtherAccount = () => {
    clearAuthTokens();
    setShowQuickLogin(false);
    setQuickLoginLabel(quickAccountLabel);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const value = emailInput.trim();
      if (!value) {
        setError(t('auth.email_required'));
        return;
      }
      if (/^\d+$/.test(value)) {
        setIsSubmitting(true);
        const userId = Number(value);
        const token = await authUserById(userId);
        clearAuthTokens();
        setUserToken(token);
        localStorage.setItem('user_id', String(userId));
        window.location.href = '/';
        return;
      }
      if (value.includes('@')) {
        if (!isValidEmail(value)) {
          setError(t('auth.email_invalid'));
          return;
        }
        setIsSubmitting(true);
        // Отправляем код подтверждения на email.
        await sendEmailAuthCode(value, SERVICE_NAME, authLanguage);
        setPendingEmail(value);
        setCodeInput('');
        setStep('code');
        setResendIn(30);
        return;
      }

      // Фолбек: если это не email и не user_id — считаем, что это токен.
      clearAuthTokens();
      setUserToken(value);
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.login_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseNumericId = (raw: unknown): number | null => {
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) return null;
      if (/^\d+$/.test(trimmed)) {
        const direct = Number(trimmed);
        return Number.isNaN(direct) ? null : direct;
      }
      const match = trimmed.match(/\b(?:user|uid|id)\s*[:=]\s*(\d+)\b/i);
      if (match) {
        const parsed = Number(match[1]);
        return Number.isNaN(parsed) ? null : parsed;
      }
    }
    return null;
  };

  const decodeUserIdFromJwt = (token: string): number | null => {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      const json = decodeURIComponent(
        atob(padded)
          .split('')
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join('')
      );
      const payload = JSON.parse(json) as { user_id?: number | string; sub?: number | string };
      const raw = payload.user_id ?? payload.sub;
      return parseNumericId(raw);
    } catch {
      return null;
    }
    return null;
  };

  const extractUserIdFromRecord = (data: Record<string, unknown>): number | null => {
    const raw =
      data.user_id ??
      data.id ??
      data.uid ??
      data.sub ??
      (typeof data.user === 'object' && data.user ? (data.user as Record<string, unknown>).id : undefined);
    return parseNumericId(raw);
  };

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const code = codeInput.trim();
    if (!code) {
      setError(t('auth.code_required'));
      return;
    }
    if (!pendingEmail) {
      setError(t('auth.email_invalid'));
      setStep('email');
      return;
    }
    setIsSubmitting(true);
    try {
      const tokens = await verifyEmailAuthCode(pendingEmail, code);
      const directToken = extractAuthToken(tokens);
      if (directToken && !tokens.access_token) {
        setUserToken(directToken);
        window.location.href = '/';
        return;
      }
      storeAuthUserLabels(normalizeLabel(pendingEmail));
      await handleAuthTokens(tokens, 'email', pendingEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.login_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingEmail || resendIn > 0) return;
    setError('');
    setIsSubmitting(true);
    try {
      await sendEmailAuthCode(pendingEmail, SERVICE_NAME, authLanguage);
      setResendIn(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.login_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeEmail = () => {
    setError('');
    setStep('email');
    setCodeInput('');
    setResendIn(0);
  };

  return (
    <main className="page-module___8aEwW__main">
      <button
        className="page-module___8aEwW__closeBtn"
        aria-label="Close"
        onClick={() => {
          try {
            window.location.href = window.location.origin + '/';
          } catch {
            window.location.href = '/';
          }
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"></path>
        </svg>
      </button>

      <div className="page-module___8aEwW__content">
        <div className="page-module___8aEwW__step">
          <h1 className="page-module___8aEwW__title">{titleText}</h1>
          <p className="page-module___8aEwW__subtitle">{subtitleText}</p>

          {error && <div className="page-module___8aEwW__error">{error}</div>}

          {step === 'email' ? (
            showQuickLogin ? (
              <div className="page-module___8aEwW__viewSwap">
                <div className="page-module___8aEwW__quickCard">
                  <div className="page-module___8aEwW__quickAvatar">
                    {(quickLoginLabel || '?')[0].toUpperCase()}
                  </div>
                  <div className="page-module___8aEwW__quickInfo">
                    <span className="page-module___8aEwW__quickLabel">{quickContinueAs}</span>
                    <span className="page-module___8aEwW__quickEmail">{quickLoginLabel}</span>
                    {quickLoginSecondary && quickLoginSecondary !== quickLoginLabel && (
                      <span className="page-module___8aEwW__quickLogin">{quickLoginSecondary}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="page-module___8aEwW__quickDismiss"
                    onClick={handleOtherAccount}
                    aria-label="Dismiss"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>

                <button
                  type="button"
                  className={`page-module___8aEwW__btn page-module___8aEwW__btnPrimary ${quickLoginLoading ? 'page-module___8aEwW__btnLoading' : ''}`}
                  disabled={quickLoginLoading}
                  onClick={handleQuickLogin}
                >
                  <span className="page-module___8aEwW__btnText">{submitText}</span>
                  {quickLoginLoading && <span className="page-module___8aEwW__spinner"></span>}
                </button>

                <div className="page-module___8aEwW__divider">
                  <span className="page-module___8aEwW__divLine"></span>
                  <span className="page-module___8aEwW__divText">{dividerText}</span>
                  <span className="page-module___8aEwW__divLine"></span>
                </div>

                <button
                  type="button"
                  className="page-module___8aEwW__btn page-module___8aEwW__btnOutline"
                  onClick={handleOtherAccount}
                >
                  {quickOtherAccount}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="page-module___8aEwW__inputWrap">
                  <input
                    className="page-module___8aEwW__input"
                    placeholder=" "
                    autoComplete="email"
                    type="email"
                    value={emailInput}
                    onChange={(event) => setEmailInput(event.target.value)}
                    disabled={isSubmitting}
                  />
                  <label className="page-module___8aEwW__inputLabel">{emailLabel}</label>
                </div>
                <button
                  type="submit"
                  className="page-module___8aEwW__btn page-module___8aEwW__btnPrimary"
                  disabled={!emailInput || isSubmitting}
                >
                  <span className="page-module___8aEwW__btnText">{submitText}</span>
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleVerifyCode} className="page-module___8aEwW__viewSwap">
              <div className="page-module___8aEwW__inputWrap">
                <input
                  className="page-module___8aEwW__input"
                  placeholder=" "
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  value={codeInput}
                  onChange={(event) => setCodeInput(event.target.value)}
                  disabled={isSubmitting}
                />
                <label className="page-module___8aEwW__inputLabel">{t('auth.code_label')}</label>
              </div>
              <button
                type="submit"
                className="page-module___8aEwW__btn page-module___8aEwW__btnPrimary"
                disabled={!codeInput || isSubmitting}
              >
                <span className="page-module___8aEwW__btnText">{t('auth.verify')}</span>
              </button>
              <div className="page-module___8aEwW__resendRow">
                {resendIn > 0 ? (
                  <div className="page-module___8aEwW__hint">
                    {t('auth.resend_in', { seconds: resendIn })}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="page-module___8aEwW__linkBtn"
                    onClick={handleResendCode}
                    disabled={isSubmitting}
                  >
                    {t('auth.resend_code')}
                  </button>
                )}
              </div>
              <div className="page-module___8aEwW__tokenToggle">
                <button type="button" className="page-module___8aEwW__linkBtn" onClick={handleChangeEmail}>
                  {t('auth.change_email')}
                </button>
              </div>
            </form>
          )}

          {step === 'email' && !showQuickLogin && (
            <>
              <div className="page-module___8aEwW__divider">
                <span className="page-module___8aEwW__divLine"></span>
                <span className="page-module___8aEwW__divText">{dividerText}</span>
                <span className="page-module___8aEwW__divLine"></span>
              </div>

              <button
                type="button"
                className="page-module___8aEwW__btn page-module___8aEwW__btnOutline page-module___8aEwW__telegramBtn"
                onClick={openTelegramAuthPopup}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.787l3.019-14.228c.309-1.239-.473-1.8-1.282-1.432z"></path>
                </svg>
                {telegramText}
              </button>

              <div className="page-module___8aEwW__tokenToggle">
                <button
                  type="button"
                  className="page-module___8aEwW__linkBtn"
                  onClick={() => setShowToken((prev) => !prev)}
                >
                  {tokenToggleText}
                </button>
              </div>

              {showToken && (
                <div className="page-module___8aEwW__tokenWrap">
                  <input
                    className="page-module___8aEwW__tokenInput"
                    placeholder={tokenPlaceholder}
                    value={tokenInput}
                    onChange={(event) => setTokenInput(event.target.value)}
                  />
                  <button type="button" className="page-module___8aEwW__linkBtn" onClick={handleTokenLogin}>
                    {tokenButtonText}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
