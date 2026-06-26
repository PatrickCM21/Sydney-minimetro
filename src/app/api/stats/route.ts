import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const mode = searchParams.get('mode') || 'daily';
  const startId = searchParams.get('start');
  const targetId = searchParams.get('target');

  if (!date) {
    return Response.json({ error: 'Missing date parameter' }, { status: 400 });
  }

  try {
    let query = supabase
      .from(mode === 'practice' ? 'practice_stats' : 'daily_stats')
      .select('*')
      .eq('date', date);

    if (mode === 'practice') {
      if (!startId || !targetId) {
        return Response.json({ error: 'Missing start or target station parameter for practice mode' }, { status: 400 });
      }
      query = query.eq('start_id', startId).eq('target_id', targetId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error fetching stats:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      // If no stats yet, return a blank template
      return Response.json({
        date,
        start_id: startId || null,
        target_id: targetId || null,
        total_submissions: 0,
        total_guesses: 0,
        avg_score: 0.0
      });
    }

    return Response.json(data);
  } catch (err) {
    const error = err as Error;
    console.error('Server error fetching stats:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const { date, guesses, score, mode = 'daily', start_id, target_id } = body;

    if (!date || typeof guesses !== 'number' || typeof score !== 'number') {
      return Response.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    const rpcName = mode === 'practice' ? 'increment_practice_stats' : 'increment_daily_stats';

    // Call the postgres function atomically updating row
    const { data, error } = await supabase.rpc(rpcName, {
      p_date: date,
      p_guesses: guesses,
      p_score: score,
      p_start_id: start_id || null,
      p_target_id: target_id || null
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data || { success: true });
  } catch (err) {
    const error = err as Error;
    console.error('Server error updating stats:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

