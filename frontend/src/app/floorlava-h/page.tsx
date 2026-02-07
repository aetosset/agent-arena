'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import MatchFloorLava from '@/components/MatchFloorLava';
import MatchFloorLavaMobileHorizontal from '@/components/MatchFloorLavaMobileHorizontal';

export default function FloorLavaHorizontalPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-[var(--color-primary)] animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />
      {isMobile ? <MatchFloorLavaMobileHorizontal /> : <MatchFloorLava />}
    </div>
  );
}
