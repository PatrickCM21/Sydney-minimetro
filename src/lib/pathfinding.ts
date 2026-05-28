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

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = ADJACENCY.get(current.id) ?? [];
    for (const { neighbor, line: edgeLine } of neighbors) {
      if (edgeLine !== line) continue;
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
  for (const line of commonLines) {
    if (findLinePath(startId, targetId, line) !== null) {
      return line;
    }
  }
  return null;
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

export function bfsShortestPathWithLines(
  startId: string,
  targetId: string
): { path: string[]; lines: LineId[] } | null {
  if (startId === targetId) {
    return { path: [startId], lines: [] };
  }

  const visited = new Set<string>([startId]);
  const queue: Array<{ id: string; path: string[]; lines: LineId[] }> = [
    { id: startId, path: [startId], lines: [] }
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = ADJACENCY.get(current.id) ?? [];
    for (const { neighbor, line } of neighbors) {
      if (neighbor === targetId) {
        return {
          path: [...current.path, neighbor],
          lines: Array.from(new Set([...current.lines, line])),
        };
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({
          id: neighbor,
          path: [...current.path, neighbor],
          lines: [...current.lines, line],
        });
      }
    }
  }

  return null;
}
