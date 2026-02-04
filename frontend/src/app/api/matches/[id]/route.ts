import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/matches/[id] - Match details/replay
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: match, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !match) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    // Get bot details
    const { data: bots } = await supabase
      .from('bots')
      .select('id, name, avatar')
      .in('id', match.bot_ids);

    const botMap: Record<string, { name: string; avatar: string }> = {};
    (bots || []).forEach(b => {
      botMap[b.id] = { name: b.name, avatar: b.avatar };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: match.id,
        status: match.status,
        bots: match.bot_ids.map((id: string) => ({
          id,
          name: botMap[id]?.name || 'Unknown',
          avatar: botMap[id]?.avatar || '🤖'
        })),
        rounds: match.rounds,
        winner: match.winner_id ? {
          id: match.winner_id,
          name: botMap[match.winner_id]?.name || 'Unknown',
          avatar: botMap[match.winner_id]?.avatar || '🤖'
        } : null,
        startedAt: match.started_at,
        endedAt: match.ended_at
      }
    });
  } catch (err) {
    console.error('Match fetch error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
