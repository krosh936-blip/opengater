import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_PROFILE: process.env.NEXT_PUBLIC_API_PROFILE ?? process.env.API_PROFILE ?? 'cdn',
    NEXT_PUBLIC_AUTH_PROFILE_ENABLED:
      process.env.NEXT_PUBLIC_AUTH_PROFILE_ENABLED ?? process.env.AUTH_PROFILE_ENABLED ?? 'true',
    NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL ?? process.env.AUTH_URL ?? 'https://reauth.cloud',
    NEXT_PUBLIC_SERVICE_NAME: process.env.NEXT_PUBLIC_SERVICE_NAME ?? process.env.SERVICE_NAME ?? 'Opengater',
    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME:
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? process.env.TELEGRAM_BOT_USERNAME ?? '',
    NEXT_PUBLIC_TELEGRAM_OAUTH_URL:
      process.env.NEXT_PUBLIC_TELEGRAM_OAUTH_URL ?? process.env.TELEGRAM_OAUTH_URL ?? '',
  },
};

export default nextConfig;
