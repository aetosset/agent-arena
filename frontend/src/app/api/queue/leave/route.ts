import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/queue/leave - Leave queue (requires X-API-Key header)
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key');

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Missing X-API-Key header' },
        { status: 401 }
      );
    }

    // Find bot by API key
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id')
      .eq('api_key', apiKey)
      .single();

    if (botError || !bot) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Remove from queue
    const { error: deleteError } = await supabase
      .from('queue')
      .delete()
      .eq('bot_id', bot.id);

    if (deleteError) {
      console.error('Queue leave error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to leave queue' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { botId: bot.id }
    });
  } catch (err) {
    console.error('Queue leave error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
