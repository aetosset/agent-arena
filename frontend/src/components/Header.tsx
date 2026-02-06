'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/lobby', label: 'LOBBY' },
  { href: '/leaderboard', label: 'LEADERBOARD' },
  { href: '/history', label: 'HISTORY' },
  { href: '/docs', label: 'DOCS' },
  { href: '/mcp', label: 'MCP' },
  { href: '/about', label: 'ABOUT' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#00ff00]/20 px-4 md:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-[#00ff00] rotate-45 flex items-center justify-center">
            <span className="text-black font-bold text-sm -rotate-45">◆</span>
          </div>
          <span className="font-bold text-xl tracking-tight">PRICEWARS</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  pathname === link.href
                    ? 'text-[#00ff00] bg-[#00ff00]/10'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/register"
            className="px-4 py-2 bg-[#00ff00] text-black font-bold text-sm rounded-lg hover:bg-[#00cc00] transition-colors"
          >
            REGISTER BOT
          </Link>
        </div>

        {/* Mobile menu button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-[#00ff00] p-2"
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
        <div className="md:hidden fixed inset-0 top-[65px] bg-[#0a0a0a] z-40 overflow-y-auto">
          <nav className="flex flex-col p-4 gap-2">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 text-lg rounded-lg transition-colors border ${
                  pathname === link.href
                    ? 'text-[#00ff00] bg-[#00ff00]/10 border-[#00ff00]/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800 border-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 px-4 py-3 bg-[#00ff00] text-black font-bold text-lg text-center rounded-lg hover:bg-[#00cc00] transition-colors"
            >
              REGISTER BOT
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
