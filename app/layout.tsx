import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { UserProvider } from '@/contexts/UserContext' // Добавляем импорт
import { LanguageProvider } from '@/contexts/LanguageContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Opengater',
  description: 'Your website description',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
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
          <LanguageProvider>
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
