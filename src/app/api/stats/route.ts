import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return Response.json({ error: 'Missing date parameter' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('date', date)
      .maybeSingle();

    if (error) {
      console.error('Error fetching stats:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      // If no stats yet, return a blank template
      return Response.json({
        date,
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
    const { date, guesses, score } = body;

    if (!date || typeof guesses !== 'number' || typeof score !== 'number') {
      return Response.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    // Call the postgres function atomically updating row
    const { data, error } = await supabase.rpc('increment_daily_stats', {
      p_date: date,
      p_guesses: guesses,
      p_score: score
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
