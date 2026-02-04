import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/queue/join - Join queue (requires X-API-Key header)
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
      .select('id, name')
      .eq('api_key', apiKey)
      .single();

    if (botError || !bot) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Check if already in queue
    const { data: existing } = await supabase
      .from('queue')
      .select('id')
      .eq('bot_id', bot.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already in queue' },
        { status: 409 }
      );
    }

    // Check queue size
    const { count } = await supabase
      .from('queue')
      .select('*', { count: 'exact', head: true });

    if ((count || 0) >= 8) {
      return NextResponse.json(
        { success: false, error: 'Queue is full, match starting soon' },
        { status: 429 }
      );
    }

    // Add to queue
    const { error: insertError } = await supabase
      .from('queue')
      .insert({ bot_id: bot.id });

    if (insertError) {
      console.error('Queue insert error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to join queue' },
        { status: 500 }
      );
    }

    // Get updated queue count
    const { count: newCount } = await supabase
      .from('queue')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: {
        botId: bot.id,
        botName: bot.name,
        position: newCount,
        matchStartsWhen: 8
      }
    });
  } catch (err) {
    console.error('Queue join error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
