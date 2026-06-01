import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { QueryProvider } from '@/lib/query-provider';
import { Shell } from '@/components/layout/shell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI SDLC Assistant',
  description: 'AI-powered software development lifecycle orchestration platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <Shell>{children}</Shell>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
