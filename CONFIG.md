# Конфигурация проекта

Основные параметры теперь задаются через `.env`/`.env.local`.

## Быстрый старт
1. Скопируйте `.env.example` в `.env.local`.
2. Заполните нужные значения.
3. Перезапустите dev-сервер.

## Ключевые переменные
- `API_URL` — основной upstream для `/api/proxy` (если без `/api`, добавится автоматически).
- `API_MIRROR_URL` — зеркало API как fallback.
- `API_UPSTREAMS` — дополнительные API upstreams через запятую.
- `AUTH_URL` — основной origin auth-сервиса (например, `https://reauth.cloud`).
- `AUTH_MIRROR_URL` — зеркало auth-сервиса.
- `AUTH_UPSTREAMS` — дополнительные auth upstreams через запятую.
- `SERVICE_NAME` — имя сервиса для auth payload (`service_name`).
- `APP_HOST` — хост приложения.
- `APP_PORT` — порт приложения.
- `CORS` — список origin через запятую (доступен в конфиге для серверного использования).
- `CORS` применяется в прокси-роутах `/api/proxy` и `/api/auth` (включая `OPTIONS`).

## Дополнительно
- `API_PROFILE` — профиль по умолчанию (`cdn` или `eutochkin`), если `API_URL` не задан.
- `AUTH_PROFILE_ENABLED` — включает/выключает auth-профиль (`true/false`).
- `TELEGRAM_BOT_USERNAME` — бот для fallback-кнопки Telegram.
- `TELEGRAM_OAUTH_URL` — fallback-ссылка Telegram OAuth.

Все переменные читаются в `lib/appConfig.ts`.
