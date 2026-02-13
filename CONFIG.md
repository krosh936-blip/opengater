# Конфигурация проекта

Этот файл — короткая шпаргалка, где меняются основные параметры без поиска по коду.

## Где переключать API
Файл: `lib/appConfig.ts`

В блоке `ACTIVE_PROFILE` должна быть активна ровно одна строка:
```ts
export const ACTIVE_PROFILE = PROFILE_EUTOCHKIN;
// export const ACTIVE_PROFILE = PROFILE_CDN;
```

## Что меняется при переключении профиля
- Апстримы для прокси `/api/proxy`.
- Telegram‑бот и OAuth‑ссылка для входа/привязки.

## Что означает каждая настройка
- `API_UPSTREAMS` — список базовых URL, куда проксируются запросы.
- `TELEGRAM_BOT_USERNAME` — бот для кнопки логина/привязки Telegram.
- `TELEGRAM_OAUTH_URL` — прямая ссылка Telegram OAuth (fallback).
- `AUTH_POPUP_ORIGIN` — домен окна авторизации (email/telegram).

Если нужно добавить новый профиль — скопируйте один из `PROFILE_*` и подставьте свои значения.
