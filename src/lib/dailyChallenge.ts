/**
 * Daily Challenge Logic
 *
 * Currently uses a date-seeded deterministic pick from a curated list.
 * 
 * TO SWAP TO A DATABASE BACKEND:
 *   Replace the `getDailyChallenge` function body with a DB query, e.g.:
 *   
 *   import { db } from '@/lib/db'  // your Prisma/Drizzle client
 *   const challenge = await db.dailyChallenge.findFirst({ where: { date } })
 *   return challenge ?? fallbackSeed(date)
 *
 * The API route and all components depend only on the return type DailyChallenge.
 */

import type { DailyChallenge } from '@/types';

import { CURATED_PAIRS } from './curatedPairs';
import stationsData from '../../public/stations.json';

// Build a mapping from old slug (e.g. "chester_hill") to the new STN- ID (e.g. "STN-CHH")
const slugMap: Record<string, string> = {};
for (const [stnId, stn] of Object.entries(stationsData as Record<string, { name: string }>)) {
  const slug = stn.name.toLowerCase()
    .replace(/ /g, '_')
    .replace(/'/g, '')
    .replace(/-/g, '_')
    .replace(/&/g, 'and');
  slugMap[slug] = stnId;
}
// Handle potential typos or differences in curatedPairs
slugMap['mount_kuring-gai'] = 'STN-MKI';
slugMap['mount_kuring_gai'] = 'STN-MKI';

/**
 * Simple integer hash of a date string for deterministic seeding.
 */
function dateHash(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // convert to 32-bit int
  }
  return Math.abs(hash);
}

/**
 * Returns today's daily challenge.
 * date format: 'YYYY-MM-DD'
 *
 * ⚡ BACKEND SWAP POINT — replace this function's body with a DB call.
 */
export function getDailyChallenge(date: string): DailyChallenge {
  const hash = dateHash(date);
  const index = hash % CURATED_PAIRS.length;
  const [startSlug, targetSlug] = CURATED_PAIRS[index];
  const start = slugMap[startSlug] || startSlug;
  const target = slugMap[targetSlug] || targetSlug;
  return { start, target, date };
}

/**
 * Returns a random practice challenge (client-side safe).
 */
export function getRandomChallenge(): Omit<DailyChallenge, 'date'> {
  const index = Math.floor(Math.random() * CURATED_PAIRS.length);
  const [startSlug, targetSlug] = CURATED_PAIRS[index];
  const start = slugMap[startSlug] || startSlug;
  const target = slugMap[targetSlug] || targetSlug;
  return { start, target };
}

/**
 * Gets today's date as YYYY-MM-DD (UTC). Specifically, bases it on sydney time
 */
export function getTodayString(): string {
  // Forces the date calculation into Sydney's timezone format (YYYY-MM-DD)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
