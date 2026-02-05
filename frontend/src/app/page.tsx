'use client';

import { useState } from 'react';
import MatchRound1 from '@/components/MatchRound1';
import Lobby from '@/components/Lobby';

// Build: 2026-02-05-v2 - force cache bust
export default function HomePage() {
  const [showMatch, setShowMatch] = useState(false);

  // Instant demo - no server, no delays
  if (showMatch) {
    return <MatchRound1 />;
  }

  return (
    <Lobby 
      queueState={null} 
      connected={false}
      onStartDemo={() => setShowMatch(true)}
    />
  );
}
