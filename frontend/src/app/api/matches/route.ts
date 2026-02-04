import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/matches - Recent finished matches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id,
        status,
        bot_ids,
        rounds,
        winner_id,
        started_at,
        ended_at,
        created_at
      `)
      .eq('status', 'finished')
      .order('ended_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Matches fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch matches' },
        { status: 500 }
      );
    }

    // Get bot names for display
    const botIds = Array.from(new Set((matches || []).flatMap(m => m.bot_ids)));
    
    let botMap: Record<string, { name: string; avatar: string }> = {};
    if (botIds.length > 0) {
      const { data: bots } = await supabase
        .from('bots')
        .select('id, name, avatar')
        .in('id', botIds);
      
      (bots || []).forEach(b => {
        botMap[b.id] = { name: b.name, avatar: b.avatar };
      });
    }

    const formatted = (matches || []).map(m => ({
      id: m.id,
      status: m.status,
      bots: m.bot_ids.map((id: string) => ({
        id,
        name: botMap[id]?.name || 'Unknown',
        avatar: botMap[id]?.avatar || '🤖'
      })),
      roundCount: m.rounds?.length || 0,
      winner: m.winner_id ? {
        id: m.winner_id,
        name: botMap[m.winner_id]?.name || 'Unknown',
        avatar: botMap[m.winner_id]?.avatar || '🤖'
      } : null,
      startedAt: m.started_at,
      endedAt: m.ended_at
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Matches error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
