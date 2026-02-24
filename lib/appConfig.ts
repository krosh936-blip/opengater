export type ApiProfile = 'eutochkin' | 'cdn';

type ApiProfileConfig = {
  name: ApiProfile;
  upstreams: string[];
  telegramBot: string;
  telegramOAuthUrl: string;
};

const PROFILE_EUTOCHKIN: ApiProfileConfig = {
  name: 'eutochkin',
  upstreams: [
    'https://api.bot.eutochkin.com/api',
    'https://cdn.opngtr.ru/api',
    'https://opngtr.com/api',
  ],
  telegramBot: 'kostik_chukcha_bot',
  telegramOAuthUrl: '',
};

const PROFILE_CDN: ApiProfileConfig = {
  name: 'cdn',
  upstreams: [
    'https://cdn.opngtr.ru/api',
    'https://opngtr.com/api',
  ],
  telegramBot: 'opengater_vpn_bot',
  telegramOAuthUrl:
    'https://oauth.telegram.org/auth?bot_id=7185292961&origin=https%3A%2F%2Freauth.cloud&request_access=write&return_to=https%3A%2F%2Freauth.cloud%2F',
};

const trimValue = (value?: string | null): string => (value || '').trim();

const normalizeUrl = (value?: string | null): string => trimValue(value).replace(/\/+$/, '');

const normalizeApiBase = (value?: string | null): string => {
  const normalized = normalizeUrl(value);
  if (!normalized) return '';
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

const splitCsv = (value?: string | null): string[] =>
  trimValue(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const unique = (items: string[]): string[] => [...new Set(items.filter(Boolean))];

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  const normalized = trimValue(value).toLowerCase();
  if (!normalized) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

const parsePort = (value: string | undefined, fallback: number): number => {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return fallback;
  }
  return numeric;
};

const authVariants = (value?: string | null): string[] => {
  const normalized = normalizeUrl(value);
  if (!normalized) return [];
  const origin = normalized.replace(/\/api$/i, '');
  return unique([`${origin}/api`, origin]);
};

const requestedProfile = trimValue(process.env.API_PROFILE || process.env.NEXT_PUBLIC_API_PROFILE).toLowerCase();
const activeProfile = requestedProfile === 'eutochkin' ? PROFILE_EUTOCHKIN : PROFILE_CDN;

const envApiPrimary = normalizeApiBase(process.env.API_URL);
const envApiMirror = normalizeApiBase(process.env.API_MIRROR_URL || process.env.API_URL_MIRROR);
const envApiUpstreams = splitCsv(process.env.API_UPSTREAMS).map((item) => normalizeApiBase(item));

export const ACTIVE_PROFILE_NAME: ApiProfile = activeProfile.name;
export const API_UPSTREAMS = unique([
  envApiPrimary,
  envApiMirror,
  ...envApiUpstreams,
  ...activeProfile.upstreams.map((item) => normalizeApiBase(item)),
]);

const defaultAuthUpstreams = ['https://reauth.cloud', 'https://cdn.opngtr.ru', 'https://opngtr.com'].flatMap((value) =>
  authVariants(value)
);

const envAuthUpstreams = splitCsv(process.env.AUTH_UPSTREAMS).flatMap((item) => authVariants(item));
const envAuthPrimary = trimValue(process.env.AUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL);
const envAuthMirror = trimValue(process.env.AUTH_MIRROR_URL || process.env.AUTH_URL_MIRROR);

export const AUTH_UPSTREAMS = unique([
  ...envAuthUpstreams,
  ...authVariants(envAuthPrimary),
  ...authVariants(envAuthMirror),
  ...defaultAuthUpstreams,
]);

export const AUTH_POPUP_ORIGIN = authVariants(envAuthPrimary)[1] || authVariants('https://reauth.cloud')[1] || 'https://reauth.cloud';

export const TELEGRAM_BOT_USERNAME =
  trimValue(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || process.env.TELEGRAM_BOT_USERNAME) ||
  activeProfile.telegramBot;

export const TELEGRAM_OAUTH_URL =
  trimValue(process.env.NEXT_PUBLIC_TELEGRAM_OAUTH_URL || process.env.TELEGRAM_OAUTH_URL) ||
  activeProfile.telegramOAuthUrl;

export const SERVICE_NAME = trimValue(process.env.NEXT_PUBLIC_SERVICE_NAME || process.env.SERVICE_NAME) || 'Opengater';

export const APP_HOST = trimValue(process.env.APP_HOST) || '0.0.0.0';
export const APP_PORT = parsePort(process.env.APP_PORT, 3000);
export const CORS_ALLOWED_ORIGINS = splitCsv(process.env.CORS || process.env.CORS_ORIGINS);

export const AUTH_PROFILE_ENABLED = parseBoolean(
  process.env.AUTH_PROFILE_ENABLED || process.env.NEXT_PUBLIC_AUTH_PROFILE_ENABLED,
  activeProfile.name === 'cdn'
);
