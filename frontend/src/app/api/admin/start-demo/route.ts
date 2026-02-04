import { NextResponse } from 'next/server';

const SERVER_URL = process.env.GAME_SERVER_URL || 'https://emily-bomb-signing-grand.trycloudflare.com';

// POST /api/admin/start-demo - Proxy to game server
export async function POST() {
  try {
    const res = await fetch(`${SERVER_URL}/api/admin/start-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Failed to start demo:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to connect to game server' },
      { status: 500 }
    );
  }
}
