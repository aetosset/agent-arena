'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

export interface ServerEvent {
  type: string;
  [key: string]: any;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<ServerEvent | null>(null);
  const [queueState, setQueueState] = useState<any>(null);
  const [matchState, setMatchState] = useState<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ServerEvent;
          setLastEvent(data);
          handleEvent(data);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('Failed to connect WebSocket:', e);
      // Retry after 3 seconds
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, []);

  const handleEvent = useCallback((event: ServerEvent) => {
    switch (event.type) {
      case 'queue_update':
        setQueueState(event.queue);
        break;
      
      case 'match_starting':
        setMatchState({
          id: event.matchId,
          phase: 'starting',
          bots: event.bots,
          startsIn: event.startsIn
        });
        break;
      
      case 'round_start':
        setMatchState((prev: any) => ({
          ...prev,
          phase: 'deliberation',
          round: event.round,
          item: event.item,
          endsAt: event.endsAt,
          bids: [],
          eliminated: []
        }));
        break;
      
      case 'bot_chat':
        setMatchState((prev: any) => ({
          ...prev,
          chat: [...(prev?.chat || []), {
            botId: event.botId,
            botName: event.botName,
            message: event.message
          }]
        }));
        break;
      
      case 'bid_locked':
        setMatchState((prev: any) => ({
          ...prev,
          lockedBids: [...(prev?.lockedBids || []), event.botId]
        }));
        break;
      
      case 'bids_reveal':
        setMatchState((prev: any) => ({
          ...prev,
          phase: 'bid-reveal',
          bids: event.bids
        }));
        break;
      
      case 'price_reveal':
        setMatchState((prev: any) => ({
          ...prev,
          phase: 'price-reveal',
          actualPrice: event.actualPrice,
          item: event.item
        }));
        break;
      
      case 'elimination':
        setMatchState((prev: any) => ({
          ...prev,
          phase: 'elimination',
          eliminated: event.eliminated
        }));
        break;
      
      case 'round_end':
        setMatchState((prev: any) => ({
          ...prev,
          phase: 'round-end',
          surviving: event.surviving,
          chat: [] // Clear chat for next round
        }));
        break;
      
      case 'match_end':
        setMatchState((prev: any) => ({
          ...prev,
          phase: 'finished',
          winner: event.winner,
          placements: event.placements
        }));
        break;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    connected,
    lastEvent,
    queueState,
    matchState,
    ws: wsRef.current
  };
}
