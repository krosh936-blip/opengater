'use client';

import { useEffect } from 'react';
import { recoverUserTokenFromAuth } from '@/lib/api';

const AuthRedirectPage = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const processAuthRedirect = async () => {
      const hash = window.location.hash.replace(/^#/, '');
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token') || '';
      const refreshToken = params.get('refresh_token') || '';
      const tokenType = params.get('token_type') || 'bearer';

      if (accessToken) {
        localStorage.setItem('auth_access_token', accessToken);
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('auth_source', 'telegram');
        if (refreshToken) {
          localStorage.setItem('auth_refresh_token', refreshToken);
          localStorage.setItem('ga_refresh_token', refreshToken);
        }

        // Try to recover user_token immediately instead of storing access_token as user_token.
        try {
          await recoverUserTokenFromAuth();
        } catch {
        }

        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            { type: 'auth_success', access_token: accessToken, refresh_token: refreshToken, token_type: tokenType },
            '*'
          );
          window.close();
          return;
        }
      }

      window.location.replace('/');
    };

    void processAuthRedirect();
  }, []);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span>Авторизация...</span>
    </main>
  );
};

export default AuthRedirectPage;
