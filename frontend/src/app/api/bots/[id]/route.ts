import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/bots/[id] - Bot profile (public data only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: bot, error } = await supabase
      .from('bots')
      .select('id, name, avatar, matches_played, wins, avg_placement, created_at')
      .eq('id', id)
      .single();

    if (error || !bot) {
      return NextResponse.json(
        { success: false, error: 'Bot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: bot.id,
        name: bot.name,
        avatar: bot.avatar,
        matchesPlayed: bot.matches_played,
        wins: bot.wins,
        winRate: bot.matches_played > 0 ? bot.wins / bot.matches_played : 0,
        avgPlacement: bot.avg_placement,
        createdAt: bot.created_at
      }
    });
  } catch (err) {
    console.error('Bot fetch error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
