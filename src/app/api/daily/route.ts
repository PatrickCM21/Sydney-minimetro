/**
 * GET /api/daily
 * Returns the daily challenge for today.
 *
 * Response: { start: string, target: string, date: string }
 *
 * To wire up a database:
 *   1. Replace getDailyChallenge() in src/lib/dailyChallenge.ts with a DB query.
 *   2. Optionally add authentication or caching here.
 */

import { getDailyChallenge, getTodayString } from '@/lib/dailyChallenge';
import { STATION_MAP } from '@/lib/networkData';

export async function GET(): Promise<Response> {
  const date = getTodayString();
  const challenge = getDailyChallenge(date);

  // Resolve station names for the response
  const startStation = STATION_MAP.get(challenge.start);
  const targetStation = STATION_MAP.get(challenge.target);

  if (!startStation || !targetStation) {
    return Response.json(
      { error: 'Invalid challenge configuration' },
      { status: 500 }
    );
  }

  return Response.json({
    start: challenge.start,
    startName: startStation.name,
    target: challenge.target,
    targetName: targetStation.name,
    date: challenge.date,
  });
}
