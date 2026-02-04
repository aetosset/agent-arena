'use client';

import { useWebSocket } from '@/lib/websocket';
import { useState } from 'react';
import MatchViewV2 from '@/components/MatchViewV2';
import Lobby from '@/components/Lobby';

export default function HomePage() {
  const { connected, matchState, queueState } = useWebSocket();
  const [showDemo, setShowDemo] = useState(false);

  // If there's an active match, show match view
  const hasActiveMatch = matchState && matchState.phase && matchState.phase !== 'finished';

  // Demo mode - use new V2 component with clean game engine
  if (showDemo) {
    return <MatchViewV2 demoMode={true} connected={false} />;
  }

  // Live match from server
  if (hasActiveMatch) {
    // TODO: Convert server matchState to GameState format
    return <MatchViewV2 demoMode={true} connected={connected} />;
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
