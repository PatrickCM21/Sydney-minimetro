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

// Curated pairs: interesting journeys that require navigation decisions.
// Both stations must exist in networkData.ts.
const CURATED_PAIRS: Array<[string, string]> = [
  ['berowra', 'cronulla'],
  ['richmond', 'waterfall'],
  ['tallawong', 'leppington'],
  ['emu_plains', 'bondi_junction'],
  ['campbelltown', 'chatswood'],
  ['penrith', 'macarthur'],
  ['richmond', 'central'],
  ['berowra', 'bankstown'],
  ['tallawong', 'central'],
  ['hornsby', 'hurstville'],
  ['liverpool', 'chatswood'],
  ['parramatta', 'bondi_junction'],
  ['blacktown', 'kogarah'],
  ['epping', 'central'],
  ['strathfield', 'hornsby'],
  ['campbelltown', 'north_sydney'],
  ['redfern', 'chatswood'],
  ['central', 'cronulla'],
  ['wynyard', 'bankstown'],
  ['parramatta', 'campbelltown'],
  ['lidcombe', 'north_sydney'],
  ['burwood', 'hurstville'],
  ['st_leonards', 'central'],
  ['epping', 'parramatta'],
  ['gordon', 'macarthur'],
  ['richmond', 'emu_plains'],
  ['berowra', 'campbelltown'],
  ['tallawong', 'bondi_junction'],
  ['north_sydney', 'bankstown'],
  ['chatswood', 'cronulla'],
  ['central', 'waterfall'],
  ['parramatta', 'north_sydney'],
  ['strathfield', 'campbelltown'],
  ['hornsby', 'leppington'],
  ['penrith', 'central'],
  ['carlingford', 'central'],
  ['olympic_park', 'north_sydney'],
  ['tallawong', 'campbelltown'],
  ['richmond', 'north_sydney'],
  ['emu_plains', 'central'],
  ['berowra', 'central'],
  ['central', 'bondi_junction'],
  ['wynyard', 'central'],
  ['blacktown', 'central'],
  ['parramatta', 'central'],
  ['liverpool', 'central'],
  ['hurstville', 'north_sydney'],
  ['chatswood', 'central'],
  ['strathfield', 'central'],
  ['redfern', 'north_sydney'],
];

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
  const [start, target] = CURATED_PAIRS[index];
  return { start, target, date };
}

/**
 * Returns a random practice challenge (client-side safe).
 */
export function getRandomChallenge(): Omit<DailyChallenge, 'date'> {
  const index = Math.floor(Math.random() * CURATED_PAIRS.length);
  const [start, target] = CURATED_PAIRS[index];
  return { start, target };
}

/**
 * Gets today's date as YYYY-MM-DD (UTC).
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}
