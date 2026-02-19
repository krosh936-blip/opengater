import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { UserProvider } from '@/contexts/UserContext' // Добавляем импорт
import { LanguageProvider } from '@/contexts/LanguageContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Opengater - личный кабинет',
  description: 'Your website description',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const cookieList = typeof (cookieStore as { getAll?: () => Array<{ name: string; value: string }> }).getAll === 'function'
    ? (cookieStore as { getAll: () => Array<{ name: string; value: string }> }).getAll()
    : []
  const savedLanguage =
    cookieList.find((item) => item.name === 'user_language')?.value ||
    (typeof (cookieStore as { get?: (name: string) => { value?: string } | undefined }).get === 'function'
      ? (cookieStore as { get: (name: string) => { value?: string } | undefined }).get('user_language')?.value
      : undefined)
  const initialLanguage =
    savedLanguage === 'ru' || savedLanguage === 'en' || savedLanguage === 'am' || savedLanguage === 'hy'
      ? savedLanguage === 'hy'
        ? 'am'
        : savedLanguage
      : 'ru'
  return (
    <html lang={initialLanguage} suppressHydrationWarning>
      <head>
        {/* Инлайн-скрипт, который выполнится ДО загрузки React */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('opengater-theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = savedTheme || (prefersDark ? 'dark' : 'light');
                  
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'light') {
                    document.documentElement.classList.add('light-theme');
                  } else {
                    document.documentElement.classList.remove('light-theme');
                  }
                  
                  // Добавляем initial-render класс
                  document.documentElement.classList.add('initial-render');
                  document.body.classList.add('initial-render');
                } catch (e) {
                  // Игнорируем ошибки, если localStorage недоступен
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className}`}>
        <div className="background" aria-hidden="true"></div>
        <ThemeProvider>
          <LanguageProvider initialLanguage={initialLanguage}>
            <UserProvider>
              {/* Оборачиваем в UserProvider */}
              <CurrencyProvider>
                {children}
              </CurrencyProvider>
            </UserProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
