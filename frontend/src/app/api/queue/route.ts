import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/queue - Queue status
export async function GET() {
  try {
    const { data: queueEntries, error } = await supabase
      .from('queue')
      .select(`
        bot_id,
        joined_at,
        bots (id, name, avatar)
      `)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Queue fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch queue' },
        { status: 500 }
      );
    }

    const bots = (queueEntries || []).map((entry: any) => ({
      botId: entry.bot_id,
      name: entry.bots?.name || 'Unknown',
      avatar: entry.bots?.avatar || '🤖',
      joinedAt: entry.joined_at
    }));

    return NextResponse.json({
      success: true,
      data: {
        bots,
        count: bots.length,
        matchStartsWhen: 8,
        ready: bots.length >= 8
      }
    });
  } catch (err) {
    console.error('Queue error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
