import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/auth-context';
import { KeyboardShortcutsProvider } from '@/components/ui/keyboard-shortcuts-provider';
import { GlobalShortcuts } from '@/components/global-shortcuts';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mail Manager',
  description: 'Email management system for NCCC',
  keywords: ['email', 'management', 'NCCC', 'mail'],
  authors: [{ name: 'NCCC' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <KeyboardShortcutsProvider>
              <GlobalShortcuts />
              <div id="root" role="application" aria-label="Mail Manager">
                {children}
              </div>
            </KeyboardShortcutsProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
