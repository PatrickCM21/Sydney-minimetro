/**
 * BFS Shortest-Path Pathfinding Engine
 * Operates on the Sydney rail network graph.
 */

import { ADJACENCY, EDGES, STATION_MAP } from './networkData';
import type { LineId } from '@/types';

/**
 * Find the shortest path along a single line.
 */
export function findLinePath(a: string, b: string, line: LineId): string[] | null {
  if (a === b) return [a];
  const queue: Array<{ id: string; path: string[] }> = [{ id: a, path: [a] }];
  const visited = new Set<string>([a]);

  const sydenhamList = ['sydenham', 'st_peters', 'erskineville'];
  const useSydenham = line === 'T8' && (sydenhamList.includes(a) || sydenhamList.includes(b));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = ADJACENCY.get(current.id) ?? [];
    for (const { neighbor, line: edgeLine } of neighbors) {
      if (edgeLine !== line) continue;

      // For T8: if neither endpoint is on the Sydenham branch, do not route through Sydenham-branch stations
      if (line === 'T8' && !useSydenham && sydenhamList.includes(neighbor)) {
        continue;
      }

      if (neighbor === b) {
        return [...current.path, neighbor];
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, path: [...current.path, neighbor] });
      }
    }
  }
  return null;
}

/**
 * BFS to find the shortest path (fewest stops) between two stations.
 * Returns an ordered array of station ids, or null if no path exists.
 */
export function bfsShortestPath(startId: string, targetId: string): string[] | null {
  if (startId === targetId) return [startId];

  const visited = new Set<string>([startId]);
  const queue: Array<{ id: string; path: string[] }> = [{ id: startId, path: [startId] }];

  while (queue.length > 0) {
    const current = queue.shift()!;

    const neighbors = ADJACENCY.get(current.id) ?? [];
    for (const { neighbor } of neighbors) {
      if (neighbor === targetId) {
        return [...current.path, neighbor];
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, path: [...current.path, neighbor] });
      }
    }
  }

  return null; // no path found
}

/**
 * Given a transfer path (list of transfer junctures), reconstruct the full physical path.
 */
export function reconstructPhysicalPath(transferPath: string[]): string[] | null {
  if (transferPath.length === 0) return null;
  const result: string[] = [transferPath[0]];

  for (let i = 0; i < transferPath.length - 1; i++) {
    const u = transferPath[i];
    const v = transferPath[i + 1];

    const uStation = STATION_MAP.get(u);
    const vStation = STATION_MAP.get(v);
    if (!uStation || !vStation) return null;

    let segmentPath: string[] | null = null;
    for (const line of uStation.lines) {
      if (vStation.lines.includes(line)) {
        const path = findLinePath(u, v, line);
        if (path) {
          segmentPath = path;
          break;
        }
      }
    }

    if (!segmentPath) return null;

    for (let j = 1; j < segmentPath.length; j++) {
      result.push(segmentPath[j]);
    }
  }

  return result;
}

/**
 * Given an ordered list of guessed station IDs (plus start/target bookends),
 * find the connected path the user has built from start to target.
 *
 * In this mode, two guessed stations can connect directly if they are on the same line
 * and there are no other guessed stations between them on that line.
 * Returns the full physical path from start to target if complete, or null if incomplete.
 */
export function extractUserPath(
  guessedIds: string[],
  startId: string,
  targetId: string
): string[] | null {
  const activeNodes = new Set([startId, targetId, ...guessedIds]);
  if (!activeNodes.has(startId) || !activeNodes.has(targetId)) return null;

  // Build the meta-graph of direct single-line connections between active nodes.
  const metaAdj = new Map<string, Set<string>>();
  for (const nodeId of activeNodes) {
    metaAdj.set(nodeId, new Set());
  }

  // Find direct connections along each line for each active node
  for (const nodeId of activeNodes) {
    const station = STATION_MAP.get(nodeId);
    if (!station) continue;

    for (const line of station.lines) {
      const queue: Array<string> = [nodeId];
      const visited = new Set<string>([nodeId]);

      while (queue.length > 0) {
        const curr = queue.shift()!;

        if (curr !== nodeId && activeNodes.has(curr)) {
          metaAdj.get(nodeId)!.add(curr);
          metaAdj.get(curr)!.add(nodeId);
          continue; // stop BFS on this branch
        }

        const neighbors = ADJACENCY.get(curr) ?? [];
        for (const { neighbor, line: edgeLine } of neighbors) {
          if (edgeLine !== line) continue;
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
    }
  }

  // Now run BFS on the meta-graph from startId to targetId to find transfer route
  const visited = new Set<string>([startId]);
  const queue: Array<{ id: string; path: string[] }> = [{ id: startId, path: [startId] }];

  let transferPath: string[] | null = null;
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.id === targetId) {
      transferPath = current.path;
      break;
    }

    const neighbors = metaAdj.get(current.id) ?? new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, path: [...current.path, neighbor] });
      }
    }
  }

  if (!transferPath) return null;

  // Reconstruct and return the full physical path, fallback to transferPath if it fails
  const physicalPath = reconstructPhysicalPath(transferPath);
  return physicalPath ?? transferPath;
}

/**
 * Returns all edges that should be lit up on the map.
 * An edge is lit up if it lies on a direct single-line path between two active stations.
 */
export function getRevealedEdges(
  guessedIds: string[],
  startId: string,
  targetId: string
): Array<{ from: string; to: string; line: LineId }> {
  const activeNodes = new Set([startId, targetId, ...guessedIds]);
  const revealed = new Set<string>();
  const result: Array<{ from: string; to: string; line: LineId }> = [];

  const makeKey = (from: string, to: string, line: LineId) => {
    const [a, b] = [from, to].sort();
    return `${a}|${b}|${line}`;
  };

  for (const nodeId of activeNodes) {
    const station = STATION_MAP.get(nodeId);
    if (!station) continue;

    for (const line of station.lines) {
      const queue: Array<{ curr: string; path: Array<{ from: string; to: string; line: LineId }> }> = [
        { curr: nodeId, path: [] }
      ];
      const visited = new Set<string>([nodeId]);

      while (queue.length > 0) {
        const { curr, path } = queue.shift()!;

        if (curr !== nodeId && activeNodes.has(curr)) {
          for (const edge of path) {
            const key = makeKey(edge.from, edge.to, edge.line);
            if (!revealed.has(key)) {
              revealed.add(key);
              result.push(edge);
            }
          }
          continue;
        }

        const neighbors = ADJACENCY.get(curr) ?? [];
        for (const { neighbor, line: edgeLine } of neighbors) {
          if (edgeLine !== line) continue;
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push({
              curr: neighbor,
              path: [...path, { from: curr, to: neighbor, line }]
            });
          }
        }
      }
    }
  }

  return result;
}

export function getEdgeKey(a: string, b: string, line: LineId): string {
  const [x, y] = [a, b].sort();
  return `${x}|${y}|${line}`;
}

export function getEdgesBetween(
  stationA: string,
  stationB: string
): Array<{ from: string; to: string; line: LineId }> {
  return EDGES.filter(e =>
    (e.from === stationA && e.to === stationB) ||
    (e.from === stationB && e.to === stationA)
  );
}

export function areAdjacent(a: string, b: string): boolean {
  return (ADJACENCY.get(a) ?? []).some(n => n.neighbor === b);
}

export function shortestDistance(a: string, b: string): number {
  const path = bfsShortestPath(a, b);
  if (!path) return Infinity;
  return path.length - 1;
}

export function getSharedLine(startId: string, targetId: string): LineId | null {
  const startStation = STATION_MAP.get(startId);
  const targetStation = STATION_MAP.get(targetId);
  if (!startStation || !targetStation) return null;

  const commonLines = startStation.lines.filter(l => targetStation.lines.includes(l));
  let bestLine: LineId | null = null;
  let minLength = Infinity;

  for (const line of commonLines) {
    const path = findLinePath(startId, targetId, line);
    if (path && path.length < minLength) {
      minLength = path.length;
      bestLine = line;
    }
  }
  return bestLine;
}

export function getLinesUsedByPath(path: string[]): LineId[] {
  const lines = new Set<LineId>();
  for (let i = 0; i < path.length - 1; i++) {
    const edges = getEdgesBetween(path[i], path[i + 1]);
    for (const edge of edges) {
      lines.add(edge.line);
    }
  }
  return Array.from(lines);
}

/**
 * Given a path of station IDs, find the sequence of lines that covers the path
 * with the absolute minimum number of line changes (transfers).
 * If allowedLines restriction is provided, only lines in allowedLines are considered.
 */
export function getMinTransferLines(path: string[], allowedLines?: LineId[]): LineId[] {
  if (path.length < 2) return [];

  // dp[i][line] = { cost: number, prevLine: LineId | null }
  const dp: Array<Record<string, { cost: number; prevLine: string | null }>> = [];

  // Step 0: first edge
  const u0 = path[0];
  const v0 = path[1];
  const edges0 = getEdgesBetween(u0, v0);
  let lines0 = edges0.map(e => e.line);
  if (allowedLines) {
    lines0 = lines0.filter(l => allowedLines.includes(l));
  }
  if (lines0.length === 0) {
    lines0 = edges0.map(e => e.line); // fallback
  }

  const step0: Record<string, { cost: number; prevLine: string | null }> = {};
  for (const line of lines0) {
    step0[line] = { cost: 0, prevLine: null };
  }
  dp.push(step0);

  // Step i: subsequent edges
  for (let i = 1; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];
    const edges = getEdgesBetween(u, v);
    let stepLines = edges.map(e => e.line);
    if (allowedLines) {
      stepLines = stepLines.filter(l => allowedLines.includes(l));
    }
    if (stepLines.length === 0) {
      stepLines = edges.map(e => e.line); // fallback
    }

    const prevStep = dp[i - 1];
    const currentStep: Record<string, { cost: number; prevLine: string | null }> = {};

    for (const nextLine of stepLines) {
      let minCost = Infinity;
      let bestPrev: string | null = null;

      for (const prevLine of Object.keys(prevStep)) {
        const cost = prevStep[prevLine].cost + (prevLine === nextLine ? 0 : 1);
        if (cost < minCost) {
          minCost = cost;
          bestPrev = prevLine;
        }
      }

      currentStep[nextLine] = { cost: minCost, prevLine: bestPrev };
    }
    dp.push(currentStep);
  }

  // Backtrack to find the optimal sequence of lines
  const result: LineId[] = [];
  const lastStep = dp[dp.length - 1];
  let minCost = Infinity;
  let currentLine: string | null = null;

  for (const line of Object.keys(lastStep)) {
    if (lastStep[line].cost < minCost) {
      minCost = lastStep[line].cost;
      currentLine = line;
    }
  }

  if (currentLine !== null) {
    let currL: string = currentLine;
    result.unshift(currL as LineId);
    for (let i = dp.length - 1; i > 0; i--) {
      const prev = dp[i][currL].prevLine;
      if (prev) {
        result.unshift(prev as LineId);
        currL = prev;
      }
    }
  }

  return result;
}

export function bfsShortestPathWithLines(
  startId: string,
  targetId: string
): { path: string[]; lines: LineId[] } | null {
  const startStation = STATION_MAP.get(startId);
  const targetStation = STATION_MAP.get(targetId);
  if (!startStation || !targetStation) return null;

  const TRANSFER_PENALTY = 4; // A transfer is worth 4 station hops

  // Queue state: { stationId: string, lineId: LineId, path: string[], lines: LineId[], transfers: number, hops: number }
  const queue: Array<{
    stationId: string;
    lineId: LineId;
    path: string[];
    lines: LineId[];
    transfers: number;
    hops: number;
  }> = [];

  for (const lineId of startStation.lines) {
    queue.push({
      stationId: startId,
      lineId,
      path: [startId],
      lines: [lineId],
      transfers: 0,
      hops: 0,
    });
  }

  const dist = new Map<string, { transfers: number; hops: number }>();
  for (const item of queue) {
    dist.set(`${item.stationId}|${item.lineId}`, { transfers: 0, hops: 0 });
  }

  let bestResult: {
    path: string[];
    lines: LineId[];
    transfers: number;
    hops: number;
  } | null = null;

  while (queue.length > 0) {
    // Sort to get the element with the minimum combined cost
    queue.sort((a, b) => {
      const costA = a.hops + a.transfers * TRANSFER_PENALTY;
      const costB = b.hops + b.transfers * TRANSFER_PENALTY;
      if (costA !== costB) {
        return costA - costB;
      }
      return a.transfers - b.transfers;
    });

    const curr = queue.shift()!;
    const currKey = `${curr.stationId}|${curr.lineId}`;

    const recorded = dist.get(currKey);
    if (recorded) {
      const recCost = recorded.hops + recorded.transfers * TRANSFER_PENALTY;
      const currCost = curr.hops + curr.transfers * TRANSFER_PENALTY;
      if (currCost > recCost || (currCost === recCost && curr.transfers > recorded.transfers)) {
        continue;
      }
    }

    if (curr.stationId === targetId) {
      const currCost = curr.hops + curr.transfers * TRANSFER_PENALTY;
      const bestCost = bestResult ? (bestResult.hops + bestResult.transfers * TRANSFER_PENALTY) : Infinity;
      if (!bestResult || currCost < bestCost || (currCost === bestCost && curr.transfers < bestResult.transfers)) {
        bestResult = curr;
      }
      continue;
    }

    // 1. Move to adjacent stations on the SAME line
    const neighbors = ADJACENCY.get(curr.stationId) ?? [];
    for (const { neighbor, line: edgeLine } of neighbors) {
      if (edgeLine !== curr.lineId) continue;

      const nextTransfers = curr.transfers;
      const nextHops = curr.hops + 1;
      const nextKey = `${neighbor}|${curr.lineId}`;
      const nextCost = nextHops + nextTransfers * TRANSFER_PENALTY;

      const prevDist = dist.get(nextKey);
      const prevCost = prevDist ? (prevDist.hops + prevDist.transfers * TRANSFER_PENALTY) : Infinity;
      if (!prevDist || nextCost < prevCost || (nextCost === prevCost && nextTransfers < prevDist.transfers)) {
        dist.set(nextKey, { transfers: nextTransfers, hops: nextHops });
        queue.push({
          stationId: neighbor,
          lineId: curr.lineId,
          path: [...curr.path, neighbor],
          lines: curr.lines,
          transfers: nextTransfers,
          hops: nextHops,
        });
      }
    }

    // 2. Transfer to another line at the current station
    const currentStation = STATION_MAP.get(curr.stationId);
    if (currentStation) {
      for (const nextLineId of currentStation.lines) {
        if (nextLineId === curr.lineId) continue;

        const nextTransfers = curr.transfers + 1;
        const nextHops = curr.hops;
        const nextKey = `${curr.stationId}|${nextLineId}`;
        const nextCost = nextHops + nextTransfers * TRANSFER_PENALTY;

        const prevDist = dist.get(nextKey);
        const prevCost = prevDist ? (prevDist.hops + prevDist.transfers * TRANSFER_PENALTY) : Infinity;
        if (!prevDist || nextCost < prevCost || (nextCost === prevCost && nextTransfers < prevDist.transfers)) {
          dist.set(nextKey, { transfers: nextTransfers, hops: nextHops });
          queue.push({
            stationId: curr.stationId,
            lineId: nextLineId,
            path: curr.path,
            lines: [...curr.lines, nextLineId],
            transfers: nextTransfers,
            hops: nextHops,
          });
        }
      }
    }
  }

  if (bestResult) {
    // Get unique lines used, preserving their first occurrence order
    const uniqueLines: LineId[] = [];
    for (const line of bestResult.lines) {
      if (!uniqueLines.includes(line)) {
        uniqueLines.push(line);
      }
    }
    return {
      path: bestResult.path,
      lines: uniqueLines,
    };
  }

  return null;
}

/**
 * Maps each station ID along a path to the line it uses in that path.
 * Prefers keeping the same line across adjacent segments to minimize transfers.
 */
export function getStationLinesOnPath(path: string[], tripLines: LineId[]): Record<string, LineId> {
  const stationLinesMap: Record<string, LineId> = {};
  if (!path || path.length === 0) return stationLinesMap;
  if (path.length === 1) {
    const s = STATION_MAP.get(path[0]);
    if (s) stationLinesMap[path[0]] = s.lines[0];
    return stationLinesMap;
  }

  const stepLines = getMinTransferLines(path, tripLines);

  for (let i = 0; i < path.length; i++) {
    const id = path[i];
    if (i === path.length - 1) {
      // Start station (at the end of the backward path): use the departing line
      stationLinesMap[id] = stepLines[path.length - 2] || tripLines[0];
    } else {
      // All other stations: use the arriving line (stepLines[i] in the backward direction)
      stationLinesMap[id] = stepLines[i] || tripLines[0];
    }
  }

  return stationLinesMap;
}

