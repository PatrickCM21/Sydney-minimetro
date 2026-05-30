import { STATION_MAP, ADJACENCY, resolveStationId } from '../src/lib/networkData';
import { bfsShortestPathWithLines, getMinTransferLines } from '../src/lib/pathfinding';

const startId = resolveStationId('town_hall');
const targetId = resolveStationId('bankstown');

console.log('--- PATHFINDING ANALYSIS: TOWN HALL TO BANKSTOWN ---');
console.log(`Start ID: ${startId} (${STATION_MAP.get(startId)?.name})`);
console.log(`Target ID: ${targetId} (${STATION_MAP.get(targetId)?.name})`);
console.log(`Target Interchanges:`, STATION_MAP.get(targetId)?.lines);

const res = bfsShortestPathWithLines(startId, targetId);
if (res) {
  const minTransfersLines = getMinTransferLines(res.path, res.lines);
  console.log('\n--- Shortest Path (bfsShortestPathWithLines) ---');
  console.log(`Path Length: ${res.path.length} stations (${res.path.length - 1} edges)`);
  console.log(`Unique Lines Returned:`, res.lines);
  console.log(`Line per segment:`, minTransfersLines);
  console.log('Path detail:');
  res.path.forEach((id, idx) => {
    const station = STATION_MAP.get(id);
    const segmentLine = idx > 0 ? minTransfersLines[idx - 1] : 'START';
    console.log(`  [${segmentLine}] -> ${station?.name} (${id}) [Interchanges: ${station?.lines.join(', ')}]`);
  });
} else {
  console.log('No path found!');
}

// Find all paths of length <= 15 and see their transfers
console.log('\n--- All paths of length 15 (14 edges) ---');
function findAllPaths(curr: string, target: string, visited: Set<string>, path: string[]) {
  if (path.length > 15) return;
  if (curr === target) {
    if (path.length === 15) {
      console.log('Found path of length 15:');
      // For each segment, find possible lines
      const segmentLines: string[][] = [];
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        const uStation = STATION_MAP.get(u)!;
        const vStation = STATION_MAP.get(v)!;
        const common = uStation.lines.filter(l => vStation.lines.includes(l));
        segmentLines.push(common);
      }
      console.log('  Path:', path.map(id => STATION_MAP.get(id)?.name).join(' -> '));
      console.log('  Segment possible lines:', segmentLines.map(l => l.join('/')).join(' -> '));
    }
    return;
  }

  const neighbors = ADJACENCY.get(curr) ?? [];
  for (const { neighbor } of neighbors) {
    if (!visited.has(neighbor)) {
      visited.add(neighbor);
      findAllPaths(neighbor, target, visited, [...path, neighbor]);
      visited.delete(neighbor);
    }
  }
}

findAllPaths(startId, targetId, new Set([startId]), [startId]);
