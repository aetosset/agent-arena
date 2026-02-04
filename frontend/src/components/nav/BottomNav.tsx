'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Bot, History } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Arena', icon: Home },
  { href: '/leaderboard', label: 'Board', icon: Trophy },
  { href: '/history', label: 'History', icon: History },
  { href: '/register', label: 'My Bot', icon: Bot },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-surface/95 backdrop-blur-xl border-t border-white/5">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex flex-col items-center justify-center gap-1 
                w-16 h-full rounded-lg
                transition-colors duration-200
                ${isActive 
                  ? 'text-brand-primary' 
                  : 'text-text-muted'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for iPhone notch */}
      <div className="h-safe-area-inset-bottom bg-surface" />
    </nav>
  );
}
