/**
 * BFS Shortest-Path Pathfinding Engine
 * Operates on the Sydney rail network graph.
 */

import { ADJACENCY, EDGES, STATION_MAP } from './networkData';
import type { LineId } from '@/types';

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
 * Given an ordered list of guessed station IDs (plus start/target bookends),
 * find the connected path the user has built from start to target.
 * 
 * A "connected path" means each consecutive pair in the list shares at least one edge.
 * Returns the ordered chain from start to target if complete, or null if incomplete.
 */
export function extractUserPath(
  guessedIds: string[],
  startId: string,
  targetId: string
): string[] | null {
  // Build the set of all guessed nodes including endpoints
  const allNodes = new Set([startId, targetId, ...guessedIds]);

  // BFS but only traversing within allNodes
  if (!allNodes.has(startId) || !allNodes.has(targetId)) return null;

  const visited = new Set<string>([startId]);
  const queue: Array<{ id: string; path: string[] }> = [{ id: startId, path: [startId] }];

  while (queue.length > 0) {
    const current = queue.shift()!;

    const neighbors = ADJACENCY.get(current.id) ?? [];
    for (const { neighbor } of neighbors) {
      if (!allNodes.has(neighbor)) continue;
      if (neighbor === targetId) {
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
 * Returns the edge key for a pair of station ids on a given line.
 * Used to check which line color to draw a revealed edge with.
 */
export function getEdgeKey(a: string, b: string, line: LineId): string {
  const [x, y] = [a, b].sort();
  return `${x}|${y}|${line}`;
}

/**
 * Get all edges between two guessed stations (may cross multiple lines).
 */
export function getEdgesBetween(
  stationA: string,
  stationB: string
): Array<{ from: string; to: string; line: LineId }> {
  return EDGES.filter(e =>
    (e.from === stationA && e.to === stationB) ||
    (e.from === stationB && e.to === stationA)
  );
}

/**
 * Checks if there is a direct edge between two stations.
 */
export function areAdjacent(a: string, b: string): boolean {
  return (ADJACENCY.get(a) ?? []).some(n => n.neighbor === b);
}

/**
 * Returns the number of stops between two stations on the shortest path.
 */
export function shortestDistance(a: string, b: string): number {
  const path = bfsShortestPath(a, b);
  if (!path) return Infinity;
  return path.length - 1; // number of stops = edges = nodes - 1
}
