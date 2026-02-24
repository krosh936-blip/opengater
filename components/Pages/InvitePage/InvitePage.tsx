'use client'
import React, { useEffect, useState } from 'react';
import './InvitePage.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser } from '@/contexts/UserContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { fetchReferredUsers, ReferredUser } from '@/lib/api';

type TelegramWebApp = {
  platform?: string;
  initDataUnsafe?: Record<string, unknown>;
  openTelegramLink?: (url: string) => void;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
};

const detectTelegram = () => {
  if (typeof window === 'undefined') return false;
  const tg = (window as TelegramWindow).Telegram?.WebApp;
  if (!tg) return false;
  try {
    return tg.platform !== 'unknown' && !!tg.initDataUnsafe && Object.keys(tg.initDataUnsafe).length > 0;
  } catch {
    return false;
  }
};

export default function InvitePage() {
  const { t } = useLanguage();
  const { user, isLoading, error, isAuthenticated } = useUser();
  const { currencyRefreshId, formatCurrency, formatMoneyFrom, convertAmount } = useCurrency();
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [isInTelegram, setIsInTelegram] = useState(false);

  useEffect(() => {
    setIsInTelegram(detectTelegram());
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!isAuthenticated) {
        setIsLoadingReferrals(false);
        return;
      }
      try {
        setIsLoadingReferrals(true);
        const data = await fetchReferredUsers();
        if (!mounted) return;
        setReferredUsers(Array.isArray(data) ? data : []);
      } catch {
        // Preserve last successful data on transient failures (rate limit / upstream hiccups).
      } finally {
        if (mounted) {
          setIsLoadingReferrals(false);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, currencyRefreshId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const referralLink = user?.web_referral_link || user?.bot_referral_link || '';
  const botLink = user?.bot_referral_link || '';

  const formatPrice = (price: number) => formatCurrency(price, { showCode: true, showSymbol: false });
  const displayPrice = (amount: number, fromCurrency?: ReferredUser['currency']) =>
    formatMoneyFrom(amount, fromCurrency || null, { showCode: true, showSymbol: false });

  const invitedCount = referredUsers.length;
  const connectedCount = referredUsers.filter((u) => u.connected === true).length;
  const totalEarned = referredUsers.reduce((sum, u) => {
    const value = Number(u.amount || 0);
    if (!Number.isFinite(value)) return sum;
    return sum + convertAmount(value, u.currency || null);
  }, 0);
  const totalEarnedDisplay = formatCurrency(totalEarned, { showCode: true, showSymbol: false });
  const progressPercent = invitedCount > 0 ? Math.min(100, Math.max(0, (connectedCount / invitedCount) * 100)) : 0;

  const bonusAmountRaw = Number(user?.referral_bonus_amount);
  const referralBonus = Number.isFinite(bonusAmountRaw) && bonusAmountRaw > 0 ? bonusAmountRaw : 50;
  const heroSubtitle = t('referral.hero_subtitle', { amount: formatPrice(referralBonus) });

  const showToast = (message: string) => {
    setToast(message);
  };

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  };

  const handleCopy = async (link: string) => {
    if (!link) {
      showToast(t('toast.link_loading'));
      return;
    }
    try {
      await copyToClipboard(link);
      showToast(t('toast.link_copied'));
    } catch {
      showToast(t('toast.link_loading'));
    }
  };

  const handleShare = async () => {
    if (!referralLink) {
      showToast(t('toast.link_loading'));
      return;
    }

    if (isInTelegram && (window as TelegramWindow).Telegram?.WebApp) {
      const tg = (window as TelegramWindow).Telegram?.WebApp;
      const shareMessage = t('referral.share_message', { bonus: formatPrice(150) });
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareMessage)}`;
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(shareUrl);
      } else {
        window.open(shareUrl, '_blank');
      }
      return;
    }

    try {
      await copyToClipboard(referralLink);
      showToast(t('toast.link_copied_share'));
    } catch {
      showToast(t('toast.link_loading'));
    }
  };

  if (isLoading) {
    return (
      <div className="invite-page loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="invite-page">
        <div className="error-container">
          <p style={{ color: 'red' }}>{t('common.error_prefix')}: {error}</p>
          <p>{t('common.check_token')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="invite-page">
        <div className="auth-required">
          <p>{t('common.auth_required')}</p>
          <p>{t('common.add_token')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-page">
      <div className="hero-section">
        <div className="hero-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
        </div>
        <h1 className="hero-title">{t('referral.hero_title')}</h1>
        <p className="hero-subtitle">{heroSubtitle}</p>
      </div>

      <section className="invite-card summary-card">
        <div className="summary-label">{t('referral.total_earned')}</div>
        <div className="summary-amount">{isLoadingReferrals ? '...' : totalEarnedDisplay}</div>
        <div className="summary-progress">
          <div className="summary-progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <div className="summary-meta">
          <div className="summary-meta-item">
            {t('referral.invited')} <strong>{isLoadingReferrals ? '...' : invitedCount}</strong>
          </div>
          <div className="summary-meta-item">
            {t('referral.connected')} <strong>{isLoadingReferrals ? '...' : connectedCount}</strong>
          </div>
        </div>
      </section>

      <section className="invite-card link-card link-card-share">
        <div className="link-card-title">{t('referral.your_link')}</div>
        <div className="link-field">
          {referralLink ? <span className="link-text">{referralLink}</span> : <span className="link-text">{t('referral.link_not_found')}</span>}
          <button className="copy-link-btn" type="button" onClick={() => handleCopy(referralLink)} aria-label={t('common.copy')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
        <button className="share-button" type="button" onClick={handleShare}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          <span className="share-button-text">{t('referral.share_button')}</span>
        </button>
      </section>

      <section className="invite-card link-card">
        <div className="link-card-title">{t('referral.bot_link')}</div>
        <div className="link-field">
          {botLink ? <span className="link-text">{botLink}</span> : <span className="link-text">{t('referral.link_not_found')}</span>}
          <button className="copy-link-btn" type="button" onClick={() => handleCopy(botLink)} aria-label={t('common.copy')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      </section>

      <section className="referrals-section">
        <div className="referrals-section-header">
          <h2 className="referrals-section-title">{t('referral.referrals_title')}</h2>
          <span className="referrals-count">{isLoadingReferrals ? '...' : invitedCount}</span>
        </div>

        <div className="invite-card referrals-card">
          {isLoadingReferrals ? (
            <div className="referrals-empty">...</div>
          ) : referredUsers.length === 0 ? (
            <div className="referrals-empty">{t('referral.no_referrals')}</div>
          ) : (
            <div className="referrals-list">
              {referredUsers.map((item, index) => {
                const initials = (item.full_name || item.username || t('referral.user'))
                  .split(' ')
                  .map((part) => part.charAt(0))
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                const isActive = item.connected === true;
                const amount = Number(item.amount || 0);
                const showAmount = isActive && Number.isFinite(amount) && amount > 0;
                const displayName = item.full_name || (item.username ? `@${item.username}` : t('referral.user'));
                const displayUsername = item.username ? `@${item.username}` : '';

                return (
                  <article className="referral-item" key={`${item.username || item.full_name || 'user'}-${index}`}>
                    <div className="referral-avatar">{initials}</div>
                    <div className="referral-main">
                      <div className="referral-name">{displayName}</div>
                      {displayUsername ? <div className="referral-username">{displayUsername}</div> : null}
                    </div>
                    <div className="referral-side">
                      <span className={`referral-status-badge ${isActive ? 'active' : 'pending'}`}>
                        {isActive ? t('referral.status_connected') : t('referral.status_invited')}
                      </span>
                      {showAmount ? <div className="referral-amount">+{displayPrice(amount, item.currency)}</div> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
