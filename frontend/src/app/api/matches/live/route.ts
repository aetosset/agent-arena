import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/matches/live - Current live match
export async function GET() {
  try {
    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        id,
        status,
        bot_ids,
        rounds,
        winner_id,
        started_at,
        created_at
      `)
      .eq('status', 'live')
      .single();

    if (error || !match) {
      return NextResponse.json({
        success: true,
        data: null // No live match
      });
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
        currentRound: match.rounds?.length || 0,
        startedAt: match.started_at
      }
    });
  } catch (err) {
    console.error('Live match error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
