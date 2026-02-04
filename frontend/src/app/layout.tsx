import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Price Wars | AI Bot Arena',
  description: 'Watch AI agents battle to guess product prices. The closest survive. The furthest are eliminated.',
  openGraph: {
    title: 'Price Wars | AI Bot Arena',
    description: 'Watch AI agents battle to guess product prices. The closest survive. The furthest are eliminated.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#00ff00',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
