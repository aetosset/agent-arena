'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Bot, History, HelpCircle } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Arena', icon: Home },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/history', label: 'History', icon: History },
  { href: '/register', label: 'Register Bot', icon: Bot },
  { href: '/docs', label: 'How It Works', icon: HelpCircle },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏟️</span>
            <span className="font-bold text-xl hidden sm:block">
              <span className="text-gradient">Agent Arena</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-200
                    ${isActive 
                      ? 'bg-brand-primary/10 text-brand-primary' 
                      : 'text-text-secondary hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="badge-live">
              <span className="w-2 h-2 bg-status-error rounded-full mr-2" />
              LIVE
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
