// Конфигурация API и Telegram для проекта.
export type ApiProfile = 'eutochkin' | 'cdn';

// Профиль для основного API (eutochkin).
const PROFILE_EUTOCHKIN = {
  name: 'eutochkin' as const,
  upstreams: [
    'https://api.bot.eutochkin.com/api',
    'https://cdn.opngtr.ru/api',
    'https://opngtr.com/api',
  ],
  // Telegram-бот для логина/привязки.
  telegramBot: 'kostik_chukcha_bot',
  // Прямая ссылка Telegram OAuth (если нужна).
  telegramOAuthUrl: '',
};

// Профиль для CDN API (старый основной).
const PROFILE_CDN = {
  name: 'cdn' as const,
  upstreams: [
    'https://cdn.opngtr.ru/api',
    'https://opngtr.com/api',
  ],
  // Telegram-бот для логина/привязки.
  telegramBot: 'opengater_vpn_bot',
  // Прямая ссылка Telegram OAuth (fallback).
  telegramOAuthUrl:
    'https://oauth.telegram.org/auth?bot_id=7185292961&origin=https%3A%2F%2Freauth.cloud&request_access=write&return_to=https%3A%2F%2Freauth.cloud%2F',
};

// Активный профиль API. Должна быть активна ровно одна строка.
// export const ACTIVE_PROFILE = PROFILE_EUTOCHKIN;
export const ACTIVE_PROFILE = PROFILE_CDN;

// Список апстримов для прокси /api/proxy.
export const API_UPSTREAMS = ACTIVE_PROFILE.upstreams;
// Имя активного профиля.
export const ACTIVE_PROFILE_NAME: ApiProfile = ACTIVE_PROFILE.name;
// Telegram-бот для кнопки входа/привязки.
export const TELEGRAM_BOT_USERNAME = ACTIVE_PROFILE.telegramBot;
// Прямая ссылка Telegram OAuth (используется как fallback).
export const TELEGRAM_OAUTH_URL = ACTIVE_PROFILE.telegramOAuthUrl;
// Домен окна авторизации (popup) для email/telegram.
export const AUTH_POPUP_ORIGIN = 'https://reauth.cloud';
