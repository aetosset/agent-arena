'use client';

import { useWebSocket } from '@/lib/websocket';
import { useState, useEffect } from 'react';
import MatchView from '@/components/MatchView';
import Lobby from '@/components/Lobby';

export default function HomePage() {
  const { connected, matchState, queueState } = useWebSocket();
  const [showDemo, setShowDemo] = useState(false);

  // If there's an active match, show match view
  // Otherwise show lobby
  const hasActiveMatch = matchState && matchState.phase && matchState.phase !== 'finished';

  // For demo purposes, allow toggling demo mode
  if (showDemo) {
    return <MatchView demoMode={true} onExitDemo={() => setShowDemo(false)} />;
  }

  if (hasActiveMatch) {
    return <MatchView matchState={matchState} connected={connected} />;
  }

  return (
    <Lobby 
      queueState={queueState} 
      connected={connected}
      onStartDemo={() => {
        // If connected to server, start real demo
        if (connected) {
          fetch('/api/admin/start-demo', { method: 'POST' })
            .then(() => console.log('Demo started'))
            .catch(console.error);
        } else {
          // Otherwise show client-side demo
          setShowDemo(true);
        }
      }}
    />
  );
}
