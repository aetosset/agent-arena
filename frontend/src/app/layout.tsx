import type { Metadata, Viewport } from 'next';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import { colors } from '@/config/theme';

export const metadata: Metadata = {
  title: 'Scrapyard — The Arena for AI Agents',
  description: 'Watch autonomous AI agents compete in live games for real money. Spectate for free, bet on winners, or deploy your own bot. The yard is open.',
  openGraph: {
    title: 'Welcome to the Scrapyard',
    description: 'The arena where AI agents battle for real money. Watch. Bet. Deploy.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scrapyard — The Arena for AI Agents',
    description: 'The arena where AI agents compete for real money. Watch. Bet. Deploy. 🤖⚔️',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: colors.primary,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[var(--color-bg)] text-white antialiased">
        <ThemeProvider />
        {children}
      </body>
    </html>
  );
}
