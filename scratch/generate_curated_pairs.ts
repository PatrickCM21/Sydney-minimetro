import { STATION_MAP, resolveStationId } from '../src/lib/networkData';
import { bfsShortestPathWithLines } from '../src/lib/pathfinding';
import type { LineId } from '../src/types';
import fs from 'fs';
import path from 'path';

function getSlug(name: string): string {
  return name.toLowerCase()
    .replace(/ /g, '_')
    .replace(/'/g, '')
    .replace(/-/g, '_')
    .replace(/&/g, 'and');
}

function generate() {
  const stationIds = Array.from(STATION_MAP.keys());
  console.log(`Loaded ${stationIds.length} stations.`);

  const transferPairs: Array<{ pair: [string, string]; lines: LineId[] }> = [];
  const singleLinePairs: Array<{ pair: [string, string]; lines: LineId[] }> = [];

  // Iterate over all unique unordered pairs
  for (let i = 0; i < stationIds.length; i++) {
    for (let j = i + 1; j < stationIds.length; j++) {
      const a = stationIds[i];
      const b = stationIds[j];

      const res = bfsShortestPathWithLines(a, b);
      if (!res) continue;

      const intermediateCount = res.path.length - 2;
      const transfers = res.lines.length - 1;

      // We want between 7 and 11 stations to guess (so path length 9 to 13)
      if (intermediateCount >= 7 && intermediateCount <= 11) {
        const aName = STATION_MAP.get(a)?.name;
        const bName = STATION_MAP.get(b)?.name;
        if (!aName || !bName) continue;

        const aSlug = getSlug(aName);
        const bSlug = getSlug(bName);

        if (transfers >= 1) {
          transferPairs.push({ pair: [aSlug, bSlug], lines: res.lines });
        } else {
          singleLinePairs.push({ pair: [aSlug, bSlug], lines: res.lines });
        }
      }
    }
  }

  console.log(`Found ${transferPairs.length} transfer pairs.`);
  console.log(`Found ${singleLinePairs.length} single line pairs.`);

  // Shuffle arrays helper
  const shuffle = <T>(arr: T[]): T[] => {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const k = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[k]] = [newArr[k], newArr[i]];
    }
    return newArr;
  };

  const shuffledTransfers = shuffle(transferPairs);
  const shuffledSingle = shuffle(singleLinePairs);

  // We want to generate ~366 pairs total
  const targetCount = 366;
  const targetSingle = Math.min(shuffledSingle.length, Math.floor(targetCount * 0.15));
  const targetTransfers = targetCount - targetSingle;

  const selectedPool: Array<{ pair: [string, string]; lines: LineId[] }> = [];

  for (let i = 0; i < Math.min(shuffledTransfers.length, targetTransfers); i++) {
    const item = shuffledTransfers[i];
    const pair: [string, string] = Math.random() > 0.5 ? [item.pair[0], item.pair[1]] : [item.pair[1], item.pair[0]];
    selectedPool.push({ pair, lines: item.lines });
  }

  for (let i = 0; i < Math.min(shuffledSingle.length, targetSingle); i++) {
    const item = shuffledSingle[i];
    const pair: [string, string] = Math.random() > 0.5 ? [item.pair[0], item.pair[1]] : [item.pair[1], item.pair[0]];
    selectedPool.push({ pair, lines: item.lines });
  }

  // --- LINE SPACING ALGORITHM ---
  // Reorder selectedPool such that we try to avoid sharing lines with recently placed pairs.
  // We want to avoid matching any line in the last 2 placed pairs (3-day span constraint).
  const orderedPairs: Array<[string, string]> = [];
  const pool = [...selectedPool];
  
  // Track recently used lines: index 0 is last day, index 1 is 2 days ago
  const recentlyUsedLines: LineId[][] = [[], []];

  while (pool.length > 0) {
    let bestIndex = -1;
    let minPenalty = Infinity;

    // To add some randomness, we can shuffle the pool or search randomly
    const candidates = shuffle(Array.from(pool.entries()));

    for (const [originalIndex, item] of candidates) {
      let penalty = 0;

      for (const line of item.lines) {
        // Last day penalty (yesterday)
        if (recentlyUsedLines[0].includes(line)) {
          penalty += 1000;
        }
        // 2 days ago penalty
        if (recentlyUsedLines[1].includes(line)) {
          penalty += 500;
        }
      }

      // Add a tiny random tiebreaker penalty to keep the order organic when penalties are equal
      penalty += Math.random() * 5;

      if (penalty < minPenalty) {
        minPenalty = penalty;
        bestIndex = originalIndex;
      }
    }

    // Place the best candidate
    const chosen = pool.splice(bestIndex, 1)[0];
    orderedPairs.push(chosen.pair);

    // Update history
    recentlyUsedLines[1] = recentlyUsedLines[0];
    recentlyUsedLines[0] = chosen.lines;
  }

  // Write to src/lib/curatedPairs.ts
  const outputPath = path.join(__dirname, '..', 'src', 'lib', 'curatedPairs.ts');
  const fileContent = `export const CURATED_PAIRS: Array<[string, string]> = ${JSON.stringify(orderedPairs, null, 2)};\n`;
  
  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  console.log(`Successfully generated and spaced ${orderedPairs.length} pairs at ${outputPath}.`);
}

generate();
