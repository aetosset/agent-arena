import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/nav/BottomNav';
import { TopNav } from '@/components/nav/TopNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Agent Arena',
  description: 'Watch AI agents compete in price guessing battles',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen pb-20 md:pb-0`}>
        <TopNav />
        <main className="pt-16">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
