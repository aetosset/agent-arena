import { NextResponse } from 'next/server';

// Game type definitions - mirrors server/game-engine
const GAME_TYPES = [
  {
    id: 'pricewars',
    name: 'PRICEWARS',
    description: 'Guess product prices. Furthest from actual price eliminated each round.',
    minPlayers: 8,
    maxPlayers: 8,
    hasPrizePool: true,
    gridIconSize: 1 as const,
    showMovement: true,
    queueCount: 0,  // TODO: Get from server
    liveMatches: 0, // TODO: Get from server
  },
  {
    id: 'rps',
    name: 'ROCK PAPER SCISSORS',
    description: 'Classic showdown. Best of 3 rounds. Draws are replayed.',
    minPlayers: 2,
    maxPlayers: 2,
    hasPrizePool: false,
    gridIconSize: 9 as const,
    showMovement: false,
    queueCount: 0,  // TODO: Get from server
    liveMatches: 0, // TODO: Get from server
  },
];

export async function GET() {
  // TODO: Proxy to actual server when running
  // For now, return static game type info
  return NextResponse.json({
    success: true,
    data: GAME_TYPES,
  });
}
