'use client';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { Currency, fetchCurrencies, recoverUserTokenFromAuth, setUserCurrency } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

interface CurrencyContextType {
  currency: Currency;
  currencies: Currency[];
  isLoading: boolean;
  currencyRefreshId: number;
  setCurrencyCode: (code: string) => Promise<void>;
  formatCurrency: (value: number, options?: { showSymbol?: boolean; showCode?: boolean }) => string;
  formatNumber: (value: number) => string;
  toRub: (value: number, fromCurrency?: Currency | null) => number;
  convertAmount: (value: number, fromCurrency?: Currency | null, toCurrencyCode?: string) => number;
  formatMoneyFrom: (value: number, fromCurrency?: Currency | null, options?: { showSymbol?: boolean; showCode?: boolean }) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'currency_code';
const PENDING_KEY = 'currency_pending_code';
const PENDING_TS_KEY = 'currency_pending_ts';
const PENDING_TTL_MS = 90 * 1000;
const waitMs = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'RUB', symbol: '₽', rate: 1, rounding_precision: 0, id: 1, hidden: false },
  { code: 'USD', symbol: '$', rate: 75, rounding_precision: 2, id: 2, hidden: false },
  { code: 'AMD', symbol: '֏', rate: 0.2, rounding_precision: 0, id: 3, hidden: false },
];

const findCurrency = (list: Currency[], code?: string | null) =>
  list.find((item) => item.code === code);

const clearCurrencySensitiveCache = () => {
  if (typeof window === 'undefined') return;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (
      key === 'opengater_cache:user' ||
      key.startsWith('opengater_cache:locations:')
    ) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((key) => localStorage.removeItem(key));
};


const mergeCurrencies = (data: Currency[]) => {
  // Совмещаем данные API с дефолтами, чтобы UI работал даже при неполном ответе.
  const map = new Map(DEFAULT_CURRENCIES.map((item) => [item.code, item]));
  data.forEach((item) => {
    const existing = map.get(item.code);
    if (!existing) {
      map.set(item.code, {
        ...item,
        rate: Number.isFinite(Number(item.rate)) ? Number(item.rate) : 1,
        rounding_precision:
          Number.isFinite(Number(item.rounding_precision)) ? Number(item.rounding_precision) : 2,
      });
      return;
    }
    map.set(item.code, {
      ...existing,
      ...item,
      rate: Number.isFinite(Number(item.rate)) ? Number(item.rate) : existing.rate,
      rounding_precision:
        Number.isFinite(Number(item.rounding_precision))
          ? Number(item.rounding_precision)
          : existing.rounding_precision,
    });
  });
  return Array.from(map.values());
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { user, refreshUser } = useUser();
  const [currencies, setCurrencies] = useState<Currency[]>(DEFAULT_CURRENCIES);
  const [selectedCode, setSelectedCode] = useState<string>('RUB');
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currencyRefreshId, setCurrencyRefreshId] = useState(0);
  const setCurrencyInFlightRef = useRef<Promise<void> | null>(null);
  const lastServerCurrencyRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadCurrencies = async () => {
      setIsLoading(true);
      try {
        const data = await fetchCurrencies();
        if (!mounted) return;
        const filtered = Array.isArray(data) ? data.filter((item) => !item.hidden) : [];
        if (filtered.length) {
          setCurrencies(mergeCurrencies(filtered));
        }
      } catch {
        // keep fallback
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadCurrencies();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Читаем сохранённую валюту при первом клиентском рендере, чтобы не было рассинхрона.
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSelectedCode(saved);
    } else {
      localStorage.setItem(STORAGE_KEY, 'RUB');
      setSelectedCode('RUB');
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!user?.currency?.code) return;
    const serverCode = String(user.currency.code || '').trim().toUpperCase();
    if (!serverCode) return;

    const prevServerCode = lastServerCurrencyRef.current;
    const serverChanged = !!prevServerCode && prevServerCode !== serverCode;
    let pendingCode = '';
    let pendingFresh = false;

    if (typeof window !== 'undefined') {
      const pendingRaw = String(localStorage.getItem(PENDING_KEY) || '').trim().toUpperCase();
      const pendingTs = Number(localStorage.getItem(PENDING_TS_KEY) || 0);
      pendingFresh = !!pendingRaw && !!pendingTs && Date.now() - pendingTs < PENDING_TTL_MS;
      pendingCode = pendingFresh ? pendingRaw : '';

      if (pendingRaw && !pendingFresh) {
        localStorage.removeItem(PENDING_KEY);
        localStorage.removeItem(PENDING_TS_KEY);
      }
      if (pendingCode && pendingCode === serverCode) {
        localStorage.removeItem(PENDING_KEY);
        localStorage.removeItem(PENDING_TS_KEY);
      }
    }

    // Пока сервер не догнал свежий pending, держим оптимистичную валюту и не откатываем UI.
    const waitingForServerSync = pendingFresh && pendingCode && pendingCode !== serverCode;
    if (waitingForServerSync) {
      if (selectedCode !== pendingCode) {
        setSelectedCode(pendingCode);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, pendingCode);
      }
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, serverCode);
    }

    const localChanged = selectedCode !== serverCode;
    if (localChanged) {
      setSelectedCode(serverCode);
    }

    if (serverChanged || localChanged) {
      clearCurrencySensitiveCache();
      setCurrencyRefreshId((prev) => prev + 1);
    }

    lastServerCurrencyRef.current = serverCode;
  }, [user?.currency?.code, selectedCode]);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    const pending = localStorage.getItem(PENDING_KEY);
    const pendingTs = Number(localStorage.getItem(PENDING_TS_KEY) || 0);
    const pendingFresh =
      !!pending && !!pendingTs && Date.now() - pendingTs < PENDING_TTL_MS;
    if (!pendingFresh) {
      localStorage.removeItem(PENDING_KEY);
      localStorage.removeItem(PENDING_TS_KEY);
    }
  }, [isHydrated]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pending = String(localStorage.getItem(PENDING_KEY) || '').trim().toUpperCase();
    const pendingTs = Number(localStorage.getItem(PENDING_TS_KEY) || 0);
    const serverCode = String(user?.currency?.code || '').trim().toUpperCase();
    const pendingFresh =
      !!pending && !!pendingTs && Date.now() - pendingTs < PENDING_TTL_MS;
    if (!pendingFresh || !pending || !serverCode || pending === serverCode) {
      return;
    }

    const timer = window.setTimeout(() => {
      refreshUser({ silent: true }).catch(() => {
        // leave current UI as is; pending sync will resolve on next natural refresh
      });
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [user?.currency?.code, refreshUser]);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, selectedCode);
  }, [isHydrated, selectedCode]);

  const currency = useMemo(() => {
    const found = findCurrency(currencies, selectedCode);
    if (found) return found;
    return {
      code: selectedCode,
      symbol: selectedCode,
      rate: 1,
      rounding_precision: 2,
      id: 0,
      hidden: false,
    } satisfies Currency;
  }, [currencies, selectedCode]);

  const toRub = (value: number, fromCurrency?: Currency | null) => {
    const source = fromCurrency || currency;
    if (!source?.rate || source.code === 'RUB') {
      return Number(value) || 0;
    }
    return (Number(value) || 0) * source.rate;
  };

  const convertAmount = (value: number, fromCurrency?: Currency | null, toCurrencyCode?: string) => {
    const source = fromCurrency || currency;
    const target = toCurrencyCode ? findCurrency(currencies, toCurrencyCode) : currency;
    if (!source || !target) return Number(value) || 0;
    if (source.code === target.code) return Number(value) || 0;
    const sourceRate = Number(source.rate) || 0;
    const targetRate = Number(target.rate) || 0;
    if (!sourceRate || !targetRate) return Number(value) || 0;
    const rubValue = source.code === 'RUB' ? (Number(value) || 0) : (Number(value) || 0) * sourceRate;
    if (target.code === 'RUB') return rubValue;
    return rubValue / targetRate;
  };

  const formatNumber = (value: number) => {
    const normalized = Number(value) || 0;
    const precision = currency?.rounding_precision ?? 0;
    return precision > 0 ? normalized.toFixed(precision) : Math.round(normalized).toString();
  };

  const formatCurrency = (value: number, options?: { showSymbol?: boolean; showCode?: boolean }) => {
    const valueFormatted = formatNumber(value);
    if (options?.showCode) {
      return `${valueFormatted} ${currency.code}`;
    }
    if (options?.showSymbol === false) {
      return valueFormatted;
    }
    const symbol = currency.symbol || currency.code;
    return `${symbol}${valueFormatted}`;
  };

  const formatMoneyFrom = (value: number, fromCurrency?: Currency | null, options?: { showSymbol?: boolean; showCode?: boolean }) => {
    const converted = convertAmount(value, fromCurrency, currency.code);
    return formatCurrency(converted, options);
  };

  const setCurrencyCode = async (code: string) => {
    const nextCode = String(code || '').trim().toUpperCase();
    if (!nextCode) return;
    if (nextCode === selectedCode && user?.currency?.code === nextCode) return;
    if (setCurrencyInFlightRef.current) {
      return setCurrencyInFlightRef.current;
    }

    const run = (async () => {
      const nextCurrency = findCurrency(currencies, nextCode);
      const nextCurrencyId = nextCurrency?.id ?? null;
      const fallbackCode = user?.currency?.code || selectedCode;
      const userId = user?.id ?? null;
      const applyServerCurrency = async () => {
        if (!userId) return;
        try {
          await setUserCurrency(userId, nextCode, nextCurrencyId);
          return;
        } catch (firstError) {
          const message = firstError instanceof Error ? firstError.message : '';
          const authError = /401|403|token|auth/i.test(message);
          if (!authError) {
            throw firstError;
          }
          try {
            const recoveredToken = await recoverUserTokenFromAuth();
            if (!recoveredToken) {
              throw firstError;
            }
            await setUserCurrency(userId, nextCode, nextCurrencyId);
            return;
          } catch {
            throw firstError;
          }
        }
      };

      if (!userId) {
        setSelectedCode(nextCode);
        setCurrencyRefreshId((prev) => prev + 1);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, nextCode);
          localStorage.removeItem(PENDING_KEY);
          localStorage.removeItem(PENDING_TS_KEY);
          clearCurrencySensitiveCache();
          window.location.reload();
        }
        return;
      }

      try {
        await applyServerCurrency();
        if (typeof window !== 'undefined') {
          localStorage.setItem(PENDING_KEY, nextCode);
          localStorage.setItem(PENDING_TS_KEY, String(Date.now()));
          localStorage.setItem(STORAGE_KEY, nextCode);
        }
        setSelectedCode(nextCode);
        setCurrencyRefreshId((prev) => prev + 1);
        if (typeof window !== 'undefined') {
          clearCurrencySensitiveCache();
          await waitMs(220);
          window.location.reload();
        }
      } catch {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, fallbackCode);
          localStorage.removeItem(PENDING_KEY);
          localStorage.removeItem(PENDING_TS_KEY);
        }
        setSelectedCode(fallbackCode);
        setCurrencyRefreshId((prev) => prev + 1);
        try {
          await refreshUser({ silent: true });
        } catch {
          // keep current state
        }
      }
    })();

    setCurrencyInFlightRef.current = run.finally(() => {
      setCurrencyInFlightRef.current = null;
    });
    return setCurrencyInFlightRef.current;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencies,
        isLoading,
        currencyRefreshId,
        setCurrencyCode,
        formatCurrency,
        formatNumber,
        toRub,
        convertAmount,
        formatMoneyFrom,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
