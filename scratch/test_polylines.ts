import fs from 'fs';
import path from 'path';
import { bfsShortestPathWithLines, getMinTransferLines } from '../src/lib/pathfinding';
import { STATION_MAP, LINE_MAP } from '../src/lib/networkData';

const routeShapes = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/sydneytrainsdata.json'), 'utf8'));

const startId = 'rockdale';
const targetId = 'north_sydney';

const res = bfsShortestPathWithLines(startId, targetId);
if (!res) {
  console.log("No path found");
  process.exit(1);
}

const pathSequence = res.path;
const tripLines = res.lines;

// Simulate revealedSet containing all stations (as if complete)
const revealedSet = new Set(pathSequence);

// Simulate the logic from GameMap.tsx
const pairsToShow: Array<[string, string]> = [];
const revealedIndices: number[] = [];
for (let i = 0; i < pathSequence.length; i++) {
  if (revealedSet.has(pathSequence[i])) {
    revealedIndices.push(i);
  }
}

for (let r = 0; r < revealedIndices.length - 1; r++) {
  const fromIdx = revealedIndices[r];
  const toIdx = revealedIndices[r + 1];

  const segmentStationIds: string[] = [];
  for (let i = fromIdx; i <= toIdx; i++) {
    segmentStationIds.push(pathSequence[i]);
  }

  let commonLines = new Set(
    STATION_MAP.get(segmentStationIds[0])?.lines.filter(l => tripLines.includes(l)) ?? []
  );
  for (let i = 1; i < segmentStationIds.length; i++) {
    const stLines = new Set(
      STATION_MAP.get(segmentStationIds[i])?.lines.filter(l => tripLines.includes(l)) ?? []
    );
    commonLines = new Set([...commonLines].filter(l => stLines.has(l)));
    if (commonLines.size === 0) break;
  }

  if (commonLines.size > 0) {
    for (let i = fromIdx; i < toIdx; i++) {
      pairsToShow.push([pathSequence[i], pathSequence[i + 1]]);
    }
  }
}

const stepLines = getMinTransferLines(pathSequence, tripLines);
const pairToLine = new Map<string, string>();
for (let i = 0; i < pathSequence.length - 1; i++) {
  const from = pathSequence[i];
  const to = pathSequence[i + 1];
  const line = stepLines[i];
  if (line) {
    pairToLine.set(`${from}|${to}`, line);
    pairToLine.set(`${to}|${from}`, line);
  }
}

console.log('pairsToShow:', pairsToShow);
console.log('pairToLine entries:');
for (const [key, val] of pairToLine.entries()) {
  console.log(`  ${key} -> ${val}`);
}

const drawnLines = new Set<string>();
for (const pair of pairsToShow) {
  const lineId = pairToLine.get(`${pair[0]}|${pair[1]}`);
  if (!lineId) continue;
  drawnLines.add(`${pair[0]} - ${pair[1]} on ${lineId}`);
}

console.log('Drawn lines:');
for (const dl of drawnLines) {
  console.log(`  ${dl}`);
}
