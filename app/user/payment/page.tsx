'use client';

import { useEffect } from 'react';
import Header from '@/components/Header/Header';
import Sidebar from '@/components/Sidebar';

const ACTIVE_PAGE_STORAGE_KEY = 'opengater_active_page';

export default function PaymentRoute() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, 'payment');
    window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'payment' }));
  }, []);

  return (
    <div className="container">
      <Header />
      <Sidebar />
    </div>
  );
}
