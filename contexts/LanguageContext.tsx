'use client'
import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type Language = 'ru' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'user_language';

const translations: Record<Language, Record<string, string>> = {
  ru: {
    'nav.home': 'Главная',
    'nav.subscription': 'Подписка',
    'nav.invite': 'Пригласить',
    'nav.raffle': 'Розыгрыш',
    'sidebar.settings': 'Настройки',
    'nav.locations': 'Локации',
    'nav.devices': 'Устройства',
    'sidebar.support': 'Поддержка',
    'nav.help': 'Помощь',
    'nav.install': 'Установка',
    'balance.title': 'Ваш баланс',
    'balance.deposit': 'Пополнить',
    'actions.invite': 'Пригласить',
    'actions.history': 'История',
    'actions.more': 'Ещё',
    'promo.raffle_title': '🎄 Новогодний розыгрыш!',
    'promo.raffle_subtitle': 'Участвуй и выиграй iPhone, iPad Air, AirPods Pro 3!',
    'promo.invite_title': 'Приглашайте друзей!',
    'promo.invite_subtitle': 'Получите 50₽ за каждого подключившегося пользователя',
    'promo.xhttp_title': 'XHTTP уже доступен!',
    'promo.xhttp_subtitle': 'Работает там, где не работает остальное',
    'setup.title': 'Установка и настройка',
    'setup.subtitle': 'Перейти к настройке',
    'setup.button': 'Начать',
    'management.title': 'Управление',
    'management.locations': 'Локации',
    'management.device_limit': 'Лимит устройств',
    'management.change': 'Изменить',
    'management.selected': 'Выбрано: {value}',
    'management.not_selected': 'Не настроено',
    'management.devices_count': '{count} устройств',
    'locations.header_title': 'Выбор локаций',
    'locations.hero_title': 'Выберите локации',
    'locations.hero_subtitle': 'Подключайтесь к серверам в нужных вам странах',
    'locations.selected_count_one': 'Выбрана {count} локация',
    'locations.selected_count_few': 'Выбрано {count} локации',
    'locations.selected_count_many': 'Выбрано {count} локаций',
    'locations.selected_count': 'Выбрано {count} локаций',
    'locations.pricing_title': 'Расчет стоимости',
    'locations.base_tariff': 'Базовый тариф',
    'locations.selected_locations': 'Выбранные локации',
    'locations.locations_cost': 'Стоимость локаций',
    'locations.total_monthly': 'Итого в месяц',
    'locations.save_button': 'Сохранить выбор',
    'locations.info_note': 'Минимум одна локация • Можно изменить позже',
    'locations.unknown_location': 'Неизвестно',
    'subscription.hero_title': 'Ссылки для подключения',
    'subscription.hero_subtitle': 'Используйте эти ссылки для добавления в приложение на устройстве',
    'subscription.global_title': 'Ссылка на подписку',
    'subscription.global_desc': 'Прямой доступ',
    'subscription.mirror_title': 'Зеркало',
    'subscription.mirror_desc': 'Доступ для России',
    'subscription.vless_title': 'VLESS-ключ',
    'subscription.vless_desc': 'Для подключения через ключ',
    'subscription.add_to': 'Добавить в...',
    'subscription.actions_menu_aria': 'Открыть меню действий',
    'common.more': 'Ещё',
    'common.copy': 'Скопировать',
    'common.copied': 'Скопировано!',
    'common.close_menu': 'Закрыть меню',
    'common.unavailable': 'Недоступно',
    'common.auth_required_subscriptions': 'Для доступа к ссылкам требуется авторизация',
    'common.in_development': 'в разработке',
    'common.loading': 'Загрузка данных...',
    'common.error_prefix': 'Ошибка',
    'common.check_token': 'Пожалуйста, проверьте токен авторизации',
    'common.auth_required': 'Для доступа к данным требуется авторизация',
    'common.add_token': 'Пожалуйста, добавьте токен в localStorage с ключом "user_token"',
    'auth.title': 'С возвращением',
    'auth.subtitle': 'Войдите в свой аккаунт',
    'auth.username': 'Username',
    'auth.username_placeholder': 'Введите username',
    'auth.password': 'Password',
    'auth.password_placeholder': 'Введите пароль',
    'auth.sign_in': 'Войти',
    'auth.signing_in': 'Вход...',
    'auth.or': 'или',
    'auth.no_account': 'Нет аккаунта?',
    'auth.register': 'Регистрация',
    'auth.login_error': 'Ошибка входа',
    'auth.telegram_error': 'Ошибка Telegram авторизации',
    'auth.username_id_hint': 'Введите числовой user_id (временный способ входа)',
    'auth.token': 'Токен',
    'auth.token_placeholder': 'Вставьте токен',
    'auth.use_token': 'Войти по токену',
    'auth.token_required': 'Введите токен',
    'profile.language': 'Язык',
    'profile.theme.dark': 'Тёмная тема',
    'profile.theme.light': 'Светлая тема',
    'profile.logout': 'Выйти',
    'profile.subscription_active': 'Активна',
    'profile.subscription_inactive': 'Не активна',
    'language.name': 'Русский',
    'days.expired': 'Истекла',
    'days.expires_today': 'Сегодня истекает',
    'days.remaining': '≈ {count} дней',
    'days.remaining_one': '≈ {count} день',
    'days.remaining_few': '≈ {count} дня',
    'devices.page_title': 'Лимит устройств',
    'devices.hero_title': 'Лимит устройств',
    'devices.hero_subtitle': 'Подключайте больше устройств к одной подписке',
    'devices.current_tariff': 'Текущий тариф',
    'devices.per_month': 'в месяц',
    'devices.plan_starter': 'Стартовый',
    'devices.plan_optimal': 'Оптимальный',
    'devices.plan_family': 'Семейный',
    'devices.plan_team': 'Команда',
    'devices.plan_custom': 'Тариф',
    'devices.popular': 'Популярно',
    'devices.devices_plural': 'устройств',
    'devices.device_single': 'устройство',
    'devices.device_one': 'устройство',
    'devices.device_few': 'устройства',
    'devices.savings_28': 'Выгода 28%',
    'devices.custom_label': 'Свое кол-во устройств',
    'devices.custom_placeholder': 'Введите кол-во от 2 до 100',
    'devices.pricing_title': 'Расчет стоимости',
    'devices.selected_devices': 'Выбрано устройств',
    'devices.discount_28': 'Скидка 28%',
    'devices.total_monthly': 'Итого в месяц',
    'devices.update_button': 'Обновить тариф',
    'devices.info_privacy': 'Не храним данные о ваших устройствах',
    'devices.info_how_works': 'Как это работает?',
  },
  en: {
    'nav.home': 'Home',
    'nav.subscription': 'Subscription',
    'nav.invite': 'Invite',
    'nav.raffle': 'Raffle',
    'sidebar.settings': 'Settings',
    'nav.locations': 'Locations',
    'nav.devices': 'Devices',
    'sidebar.support': 'Support',
    'nav.help': 'Help',
    'nav.install': 'Install',
    'balance.title': 'Your balance',
    'balance.deposit': 'Top up',
    'actions.invite': 'Invite',
    'actions.history': 'History',
    'actions.more': 'More',
    'promo.raffle_title': '🎄 New Year Raffle!',
    'promo.raffle_subtitle': 'Participate and win iPhone, iPad Air, AirPods Pro 3!',
    'promo.invite_title': 'Invite friends!',
    'promo.invite_subtitle': 'Get 0.6$ for each connected user',
    'promo.xhttp_title': 'XHTTP is now available!',
    'promo.xhttp_subtitle': 'Works where others don\'t',
    'setup.title': 'Installation and setup',
    'setup.subtitle': 'Go to setup',
    'setup.button': 'Start',
    'management.title': 'Management',
    'management.locations': 'Locations',
    'management.device_limit': 'Device limit',
    'management.change': 'Change',
    'management.selected': 'Selected: {value}',
    'management.not_selected': 'Not set',
    'management.devices_count': '{count} devices',
    'locations.header_title': 'Select locations',
    'locations.hero_title': 'Choose locations',
    'locations.hero_subtitle': 'Connect to servers in the countries you need',
    'locations.selected_count_one': 'Selected {count} location',
    'locations.selected_count_few': 'Selected {count} locations',
    'locations.selected_count_many': 'Selected {count} locations',
    'locations.selected_count': 'Selected {count} locations',
    'locations.pricing_title': 'Pricing summary',
    'locations.base_tariff': 'Base tariff',
    'locations.selected_locations': 'Selected locations',
    'locations.locations_cost': 'Locations cost',
    'locations.total_monthly': 'Total per month',
    'locations.save_button': 'Save selection',
    'locations.info_note': 'At least one location • You can change later',
    'locations.unknown_location': 'Unknown',
    'subscription.hero_title': 'Connection links',
    'subscription.hero_subtitle': 'Use these links to add to the app on your device',
    'subscription.global_title': 'Subscription link',
    'subscription.global_desc': 'Direct access',
    'subscription.mirror_title': 'Mirror',
    'subscription.mirror_desc': 'Access for Russia',
    'subscription.vless_title': 'VLESS key',
    'subscription.vless_desc': 'For connecting via key',
    'subscription.add_to': 'Add to...',
    'subscription.actions_menu_aria': 'Open actions menu',
    'common.more': 'More',
    'common.copy': 'Copy',
    'common.copied': 'Copied!',
    'common.close_menu': 'Close menu',
    'common.unavailable': 'Unavailable',
    'common.auth_required_subscriptions': 'Authorization is required to access links',
    'common.in_development': 'in development',
    'common.loading': 'Loading data...',
    'common.error_prefix': 'Error',
    'common.check_token': 'Please check your auth token',
    'common.auth_required': 'Authorization is required to access data',
    'common.add_token': 'Please add a token to localStorage with key "user_token"',
    'auth.title': 'Welcome back',
    'auth.subtitle': 'Sign in to your account',
    'auth.username': 'Username',
    'auth.username_placeholder': 'Enter your username',
    'auth.password': 'Password',
    'auth.password_placeholder': 'Enter your password',
    'auth.sign_in': 'Sign In',
    'auth.signing_in': 'Signing in...',
    'auth.or': 'or',
    'auth.no_account': 'Don\'t have an account?',
    'auth.register': 'Register',
    'auth.login_error': 'Login failed',
    'auth.telegram_error': 'Telegram auth failed',
    'auth.username_id_hint': 'Enter numeric user_id (temporary login)',
    'auth.token': 'Token',
    'auth.token_placeholder': 'Paste token',
    'auth.use_token': 'Use token',
    'auth.token_required': 'Enter token',
    'profile.language': 'Language',
    'profile.theme.dark': 'Dark theme',
    'profile.theme.light': 'Light theme',
    'profile.logout': 'Log out',
    'profile.subscription_active': 'Active',
    'profile.subscription_inactive': 'Inactive',
    'language.name': 'English',
    'days.expired': 'Expired',
    'days.expires_today': 'Expires today',
    'days.remaining': '≈ {count} days',
    'days.remaining_one': '≈ {count} day',
    'days.remaining_few': '≈ {count} days',
    'devices.page_title': 'Device limit',
    'devices.hero_title': 'Device limit',
    'devices.hero_subtitle': 'Connect more devices to one subscription',
    'devices.current_tariff': 'Current plan',
    'devices.per_month': 'per month',
    'devices.plan_starter': 'Starter',
    'devices.plan_optimal': 'Optimal',
    'devices.plan_family': 'Family',
    'devices.plan_team': 'Team',
    'devices.plan_custom': 'Plan',
    'devices.popular': 'Popular',
    'devices.devices_plural': 'devices',
    'devices.device_single': 'device',
    'devices.device_one': 'device',
    'devices.device_few': 'devices',
    'devices.savings_28': 'Save 28%',
    'devices.custom_label': 'Custom number of devices',
    'devices.custom_placeholder': 'Enter a number from 2 to 100',
    'devices.pricing_title': 'Pricing summary',
    'devices.selected_devices': 'Selected devices',
    'devices.discount_28': '28% discount',
    'devices.total_monthly': 'Total per month',
    'devices.update_button': 'Update plan',
    'devices.info_privacy': 'We do not store data about your devices',
    'devices.info_how_works': 'How does it work?',
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('ru');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem(LANGUAGE_STORAGE_KEY)) || '';
    if (saved === 'en' || saved === 'ru') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
  };

  const t = useMemo(() => {
    const dict = translations[language];
    return (key: string, params?: Record<string, string | number>) => {
      const template = dict[key] || translations.ru[key] || key;
      if (!params) return template;
      return Object.entries(params).reduce((acc, [k, v]) => {
        return acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }, template);
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
