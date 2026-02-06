'use client';

import { useState } from 'react';
import LandingPage from '@/components/LandingPage';
import MatchRound1 from '@/components/MatchRound1';

// Build: 2026-02-06-v1 - New landing page with PRICEWARS branding
export default function HomePage() {
  const [view, setView] = useState<'landing' | 'demo'>('landing');

  if (view === 'demo') {
    return <MatchRound1 />;
  }

  return <LandingPage onViewLive={() => setView('demo')} />;
}
