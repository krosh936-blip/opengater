import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { UserProvider } from '@/contexts/UserContext' // Добавляем импорт
import { LanguageProvider } from '@/contexts/LanguageContext'

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
                  // Проверяем сохраненную тему
                  var savedTheme = localStorage.getItem('opengater-theme');
                  
                  // Если есть сохраненная светлая тема, сразу добавляем класс
                  if (savedTheme === 'light') {
                    document.documentElement.classList.add('light-theme');
                  }
                  
                  // Если нет сохраненной темы, проверяем системные настройки
                  else if (!savedTheme) {
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (!prefersDark) {
                      document.documentElement.classList.add('light-theme');
                    }
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
            <UserProvider> {/* Оборачиваем в UserProvider */}
              {children}
            </UserProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
