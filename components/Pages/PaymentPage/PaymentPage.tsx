'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './PaymentPage.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useUser } from '@/contexts/UserContext';
import {
  createPayment,
  fetchPaymentBonus,
  fetchPaymentSystems,
  fetchPaymentTariffs,
  PaymentSystem,
} from '@/lib/api';

type PaymentStep = 1 | 2 | 3;

type AmountPreset = {
  amount: number;
  bonus: number;
  name?: string;
};

const AMOUNT_PRESETS: AmountPreset[] = [
  { amount: 150, bonus: 0 },
  { amount: 450, bonus: 0 },
  { amount: 850, bonus: 50 },
  { amount: 1600, bonus: 200 },
];

const LANGUAGE_NAME_BY_CODE: Record<string, string> = {
  ru: 'Русский',
  en: 'English',
  am: 'Հայերեն',
};

const FALLBACK_SYSTEMS_BY_CURRENCY: Record<string, PaymentSystem[]> = {
  RUB: [
    { name: 'Crypto | USDT, BTC, ETH, TON ', currency_code: 'USD' },
    { name: 'RUB | Карты, SberPay, ЮMoney ', currency_code: 'RUB' },
  ],
  USD: [{ name: 'Crypto | USDT, BTC, ETH, TON ', currency_code: 'USD' }],
  AMD: [{ name: 'Crypto | USDT, BTC, ETH, TON ', currency_code: 'USD' }],
};

const isCryptoMethod = (value: string) =>
  /crypto|crypt|usdt|btc|eth|ton|tron|coin|mus|heleket|wallet/i.test(value);

const normalizeSystemName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

const getMethodTitle = (system: string, t: (key: string) => string) => {
  const visibleSystem = system.trim();
  if (/^yookassa$/i.test(visibleSystem)) {
    return t('payment.method_rub_title');
  }
  if (isCryptoMethod(visibleSystem)) {
    return t('payment.method_crypto_title');
  }
  return visibleSystem;
};

export default function PaymentPage() {
  const { t, language } = useLanguage();
  const { currency, formatNumber } = useCurrency();
  const { user, isLoading, error, isAuthenticated } = useUser();

  const [step, setStep] = useState<PaymentStep>(1);
  const [selectedPreset, setSelectedPreset] = useState<AmountPreset | null>(AMOUNT_PRESETS[0]);
  const [amountInput, setAmountInput] = useState<string>(String(AMOUNT_PRESETS[0].amount));
  const [amountPresets, setAmountPresets] = useState<AmountPreset[]>(AMOUNT_PRESETS);
  const [bonusValue, setBonusValue] = useState<number>(AMOUNT_PRESETS[0].bonus);
  const [isBonusLoading, setIsBonusLoading] = useState(false);

  const [paymentSystems, setPaymentSystems] = useState<PaymentSystem[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<string>('');
  const [isSystemsLoading, setIsSystemsLoading] = useState(false);

  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdPaymentUrl, setCreatedPaymentUrl] = useState<string>('');
  const amountInputRef = useRef(amountInput);
  const selectedPresetRef = useRef<AmountPreset | null>(selectedPreset);
  const selectedSystemRef = useRef(selectedSystem);

  const amountValue = Math.max(0, Number(amountInput || 0));
  const fallbackBonus = selectedPreset?.amount === amountValue ? selectedPreset.bonus : 0;
  const totalValue = amountValue + bonusValue;

  const paymentMethods = useMemo(() => {
    return paymentSystems.map((system, index) => {
      const normalized = normalizeSystemName(system.name || `system-${index}`);
      const crypto = isCryptoMethod(system.name || '');
      return {
        id: `${normalized}-${index}`,
        system: system.name,
        title: getMethodTitle(system.name, t),
        subtitle: t('payment.method_available'),
        crypto,
      };
    });
  }, [paymentSystems, t]);

  const selectedMethod = useMemo(
    () => paymentMethods.find((method) => method.system === selectedSystem) || null,
    [paymentMethods, selectedSystem]
  );

  useEffect(() => {
    amountInputRef.current = amountInput;
  }, [amountInput]);

  useEffect(() => {
    selectedPresetRef.current = selectedPreset;
  }, [selectedPreset]);

  useEffect(() => {
    selectedSystemRef.current = selectedSystem;
  }, [selectedSystem]);

  useEffect(() => {
    let active = true;

    const loadTariffs = async () => {
      try {
        const tariffs = await fetchPaymentTariffs();
        if (!active || tariffs.length === 0) return;

        const mapped = tariffs
          .map((tariff) => ({
            name: tariff.name,
            amount: Number(tariff.amount),
            bonus: Number(tariff.bonus || 0),
          }))
          .filter((preset) => Number.isFinite(preset.amount) && preset.amount > 0)
          .sort((a, b) => a.amount - b.amount);

        if (!mapped.length) return;

        setAmountPresets(mapped);
        const currentAmount = Number(amountInputRef.current || 0);
        const matched = mapped.find((preset) => preset.amount === currentAmount) || null;

        if (selectedPresetRef.current) {
          if (matched) {
            setSelectedPreset(matched);
          } else {
            setSelectedPreset(mapped[0]);
            setAmountInput(String(mapped[0].amount));
          }
        } else {
          setSelectedPreset(matched);
        }
      } catch {
        // Keep local presets as fallback.
      }
    };

    loadTariffs();
    return () => {
      active = false;
    };
  }, [currency.code]);

  useEffect(() => {
    let active = true;

    const loadPaymentSystems = async () => {
      try {
        setIsSystemsLoading(true);
        const languageName = LANGUAGE_NAME_BY_CODE[language] || 'English';
        const systems = await fetchPaymentSystems(languageName, currency.code);

        if (!active) return;

        if (systems.length) {
          setPaymentSystems(systems);
          if (!systems.some((system) => system.name === selectedSystemRef.current)) {
            setSelectedSystem(systems[0].name);
            selectedSystemRef.current = systems[0].name;
          }
          return;
        }
      } catch {
        // Fallback below.
      } finally {
        if (active) {
          setIsSystemsLoading(false);
        }
      }

      if (!active) return;

      const fallback =
        FALLBACK_SYSTEMS_BY_CURRENCY[currency.code] ||
        [{ name: 'Crypto | USDT, BTC, ETH, TON ', currency_code: 'USD' }];

      setPaymentSystems(fallback);
      if (!fallback.some((system) => system.name === selectedSystemRef.current)) {
        setSelectedSystem(fallback[0].name);
        selectedSystemRef.current = fallback[0].name;
      }
    };

    loadPaymentSystems();
    return () => {
      active = false;
    };
  }, [currency.code, language]);

  useEffect(() => {
    setBonusValue(fallbackBonus);
  }, [fallbackBonus]);

  useEffect(() => {
    if (amountValue <= 0) {
      setBonusValue(0);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      try {
        setIsBonusLoading(true);
        const bonus = await fetchPaymentBonus(amountValue, currency.code, controller.signal);
        if (active) {
          setBonusValue(Number.isFinite(bonus) ? bonus : fallbackBonus);
        }
      } catch {
        if (active) {
          setBonusValue(fallbackBonus);
        }
      } finally {
        if (active) {
          setIsBonusLoading(false);
        }
      }
    }, 320);

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [amountValue, currency.code, fallbackBonus]);

  const minimumAmount = useMemo(() => {
    const values = amountPresets
      .map((preset) => preset.amount)
      .filter((amount) => Number.isFinite(amount) && amount > 0);
    return values.length ? Math.min(...values) : 50;
  }, [amountPresets]);

  const hasInput = amountInput.trim().length > 0;
  const isBelowMinimum = hasInput && amountValue > 0 && amountValue < minimumAmount;
  const canPay = amountValue >= minimumAmount && !!selectedMethod;

  const handleMethodSelect = (systemName: string) => {
    setSelectedSystem(systemName);
    setSubmitError(null);
    setStep(2);
  };

  const handlePresetSelect = (preset: AmountPreset) => {
    setSelectedPreset(preset);
    setAmountInput(String(preset.amount));
  };

  const handleAmountInput = (value: string) => {
    const digits = value.replace(/[^\d]/g, '');
    setAmountInput(digits);
    setSelectedPreset(null);
  };

  const handlePay = async () => {
    if (!canPay || !selectedMethod) return;

    setSubmitError(null);
    setCreatedPaymentUrl('');
    setIsCreatingPayment(true);
    setStep(3);

    try {
      const paymentUrl = await createPayment(selectedMethod.system, amountValue);
      setCreatedPaymentUrl(paymentUrl);
      if (typeof window !== 'undefined') {
        window.location.assign(paymentUrl);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('common.error_prefix');
      setSubmitError(message);
      setIsCreatingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="payment-page loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="payment-page">
        <div className="error-container">
          <p style={{ color: 'red' }}>{t('common.error_prefix')}: {error}</p>
          <p>{t('common.check_token')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="payment-page">
        <div className="auth-required">
          <p>{t('common.auth_required')}</p>
          <p>{t('common.add_token')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-progress">
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className={`payment-progress-segment ${step >= index ? 'active' : ''}`}
            onClick={() => {
              if (index < step && !isCreatingPayment) {
                setStep(index as PaymentStep);
              }
            }}
            role="button"
            tabIndex={index < step && !isCreatingPayment ? 0 : -1}
            aria-label={`Step ${index}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="payment-step">
          <div className="payment-step-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="5" y="10" width="14" height="10" rx="2"></rect>
              <path d="M8 10V7a4 4 0 1 1 8 0v3"></path>
            </svg>
          </div>
          <h2 className="payment-step-title">{t('payment.step_method_title')}</h2>
          <p className="payment-step-subtitle">{t('payment.step_method_subtitle')}</p>

          <div className="payment-methods">
            {isSystemsLoading ? <div className="payment-method-card payment-method-card-loading">...</div> : null}
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                className={`payment-method-card ${selectedSystem === method.system ? 'active' : ''}`}
                onClick={() => handleMethodSelect(method.system)}
              >
                <div className="payment-method-icon">
                  {method.crypto ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="9"></circle>
                      <path d="M8 11h6a2 2 0 0 1 0 4H9.5a2 2 0 0 0 0 4H14"></path>
                      <path d="M12 7v10"></path>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="6" width="18" height="12" rx="2"></rect>
                      <path d="M3 10H21"></path>
                      <circle cx="7" cy="14" r="1.5" fill="currentColor"></circle>
                    </svg>
                  )}
                </div>
                <div className="payment-method-info">
                  <div className="payment-method-title">{method.title}</div>
                  <div className="payment-method-subtitle">{method.subtitle}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="payment-step-note">{t('payment.secure_note')}</div>
        </div>
      )}

      {step === 2 && (
        <div className="payment-step">
          <div className="payment-step-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 7v10"></path>
              <path d="M8.5 10.5c0-1.3 1.3-2.3 3.5-2.3s3.5 1 3.5 2.3-1.3 2.3-3.5 2.3-3.5 1-3.5 2.3 1.3 2.3 3.5 2.3 3.5-1 3.5-2.3"></path>
            </svg>
          </div>
          <h2 className="payment-step-title">{t('payment.step_amount_title')}</h2>
          <p className="payment-step-subtitle">{t('payment.step_amount_subtitle')}</p>
          <div className="payment-selected-method">{selectedMethod?.system || ''}</div>

          <div className="payment-amounts">
            {amountPresets.map((preset, index) => (
              <button
                key={preset.amount}
                type="button"
                className={`payment-amount-chip ${amountValue === preset.amount ? 'active' : ''}`}
                onClick={() => handlePresetSelect(preset)}
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <span>{formatNumber(preset.amount)} {currency.code}</span>
                {preset.bonus > 0 ? (
                  <span className="payment-amount-bonus">+{formatNumber(preset.bonus)} {currency.code}</span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="payment-input-card">
            <div className="payment-input-label">{t('payment.input_label')}</div>
            <div className={`payment-input-field ${isBelowMinimum ? 'error' : ''}`}>
              <span className="payment-input-currency">{currency.symbol || currency.code}</span>
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={(event) => handleAmountInput(event.target.value)}
                placeholder="0"
              />
            </div>
            {isBelowMinimum ? (
              <div className="payment-input-error">
                {t('payment.min_error', { amount: formatNumber(minimumAmount), currency: currency.code })}
              </div>
            ) : null}
          </div>

          <div className="payment-calc-card">
            <div className="payment-calc-title">{t('payment.calculation_title')}</div>
            <div className="payment-calc-row">
              <span>{t('payment.calc_amount')}</span>
              <span>{formatNumber(amountValue)} {currency.code}</span>
            </div>
            <div className="payment-calc-row">
              <span>{t('payment.calc_bonus')}</span>
              <span className="payment-calc-bonus">
                {isBonusLoading ? '...' : formatNumber(bonusValue)} {currency.code}
              </span>
            </div>
            <div className="payment-calc-row total">
              <span>{t('payment.calc_total')}</span>
              <span>{formatNumber(totalValue)} {currency.code}</span>
            </div>
          </div>

          <button
            type="button"
            className="payment-cta"
            disabled={!canPay}
            onClick={handlePay}
          >
            {t('payment.pay_button')}
            <span className="payment-cta-arrow">&gt;</span>
          </button>

          <div className="payment-step-note">
            {t('payment.minimum_note', { amount: formatNumber(minimumAmount), currency: currency.code })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="payment-step">
          {!submitError ? (
            <>
              <div className="payment-spinner"></div>
              <h2 className="payment-step-title">{t('payment.step_processing_title')}</h2>
              <p className="payment-step-subtitle">{t('payment.step_processing_subtitle')}</p>

              <div className="payment-details-card">
                <div className="payment-details-label">{t('payment.details_title')}</div>
                <div className="payment-details-name">{selectedMethod?.system || t('payment.details_name')}</div>
                <div className="payment-details-amount">{formatNumber(amountValue)} {currency.code}</div>
                {createdPaymentUrl ? (
                  <a className="payment-manual-link" href={createdPaymentUrl} target="_blank" rel="noreferrer">
                    {createdPaymentUrl}
                  </a>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <h2 className="payment-step-title">{t('common.error_prefix')}</h2>
              <p className="payment-step-subtitle">{submitError}</p>
              <button type="button" className="payment-cta" onClick={handlePay}>
                {t('payment.pay_button')}
              </button>
              <button type="button" className="payment-cta payment-cta-secondary" onClick={() => setStep(2)}>
                {t('common.back')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
