'use client';

import { useState } from 'react';
import MatchRound1 from '@/components/MatchRound1';
import Lobby from '@/components/Lobby';

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
