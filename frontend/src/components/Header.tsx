'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRAND, NAV } from '@/config';
import { Logo } from '@/components/brand/Logo';

const NAV_LINKS = [
  { href: '/lobby', label: NAV.lobby },
  { href: '/leaderboard', label: NAV.leaderboard },
  { href: '/history', label: NAV.history },
  { href: '/docs', label: NAV.docs },
  { href: '/mcp', label: NAV.mcp },
  { href: '/about', label: NAV.about },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-primary-border)] px-4 md:px-6 py-4 flex items-center justify-between">
        <Logo size="md" href="/" />

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  pathname === link.href
                    ? 'text-[var(--color-primary)] bg-[var(--color-primary-glow)]'
                    : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/register"
            className="px-4 py-2 bg-[var(--color-primary)] text-black font-bold text-sm rounded-lg hover:bg-[var(--color-primary-dim)] transition-colors"
          >
            {NAV.register}
          </Link>
        </div>

        {/* Mobile menu button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-[var(--color-primary)] p-2"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] bg-[var(--color-bg)] z-40 overflow-y-auto">
          <nav className="flex flex-col p-4 gap-2">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 text-lg rounded-lg transition-colors border ${
                  pathname === link.href
                    ? 'text-[var(--color-primary)] bg-[var(--color-primary-glow)] border-[var(--color-primary-border)]'
                    : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface)] border-[var(--color-border)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 px-4 py-3 bg-[var(--color-primary)] text-black font-bold text-lg text-center rounded-lg hover:bg-[var(--color-primary-dim)] transition-colors"
            >
              {NAV.register}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
