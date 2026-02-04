import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { randomBytes } from 'crypto';

// POST /api/bots - Register new bot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, avatar } = body;

    // Validate
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (name.length < 3 || name.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Name must be 3-20 characters' },
        { status: 400 }
      );
    }

    // Check if name taken
    const { data: existing } = await supabase
      .from('bots')
      .select('id')
      .ilike('name', name)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Bot name already taken' },
        { status: 409 }
      );
    }

    // Generate API key
    const apiKey = randomBytes(24).toString('hex');

    // Create bot
    const { data: bot, error } = await supabase
      .from('bots')
      .insert({
        name: name.trim(),
        avatar: avatar || '🤖',
        api_key: apiKey
      })
      .select('id, name, avatar, api_key')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create bot' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: bot.id,
        name: bot.name,
        avatar: bot.avatar,
        apiKey: bot.api_key // Only returned once!
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/bots - Leaderboard
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('bots')
      .select('id, name, avatar, matches_played, wins, avg_placement')
      .gte('matches_played', 1)
      .order('wins', { ascending: false })
      .order('avg_placement', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    const leaderboard = (data || []).map((bot, i) => ({
      rank: i + 1,
      bot: {
        id: bot.id,
        name: bot.name,
        avatar: bot.avatar,
        matchesPlayed: bot.matches_played,
        wins: bot.wins,
        winRate: bot.matches_played > 0 ? bot.wins / bot.matches_played : 0,
        avgPlacement: bot.avg_placement
      }
    }));

    return NextResponse.json({ success: true, data: leaderboard });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
