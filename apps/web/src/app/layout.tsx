import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import { RootErrorBoundary } from '@/components/error-boundary';
import { Shell } from '@/components/layout/shell';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { QueryProvider } from '@/lib/query-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AI SDLC Assistant',
  description: 'AI-powered software development lifecycle orchestration platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <RootErrorBoundary>
              <Shell>{children}</Shell>
            </RootErrorBoundary>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
