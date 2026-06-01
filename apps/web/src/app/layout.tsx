import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { QueryProvider } from '@/lib/query-provider';
import { Shell } from '@/components/layout/shell';
import { RootErrorBoundary } from '@/components/error-boundary';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AI SDLC Assistant',
  description: 'AI-powered software development lifecycle orchestration platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body>
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
