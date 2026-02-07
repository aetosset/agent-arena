'use client';

import Header from '@/components/Header';
import MatchFloorLava from '@/components/MatchFloorLava';

export default function FloorLavaPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />
      <MatchFloorLava />
    </div>
  );
}
