'use client';

/**
 * GameMap — Leaflet-based geographic map of the Sydney rail network.
 *
 * Background: CartoDB Positron (greyscale city tiles)
 * Game overlay: Custom SVG paths & HTML markers rendered natively via React-Leaflet.
 * Station coordinates: Real WGS-84 lat/lng from networkData.ts.
 */

import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { MapContainer, TileLayer, useMap, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-smoothwheelzoom';

import { LINE_MAP, STATION_MAP } from '@/lib/networkData';
import { getStationLinesOnPath, getMinTransferLines } from '@/lib/pathfinding';
import type { LineId, Station } from '@/types';

interface GameMapProps {
  startId: string;
  targetId: string;
  guessedIds: string[];
  optimalPath?: string[];
  isComplete: boolean;
  wrongGuesses?: string[];
  tripLines?: LineId[];
  tripPath?: string[];
  hardMode?: boolean;
  darkMap?: boolean;
  hoveredStationId?: string | null;
  mode?: 'daily' | 'practice';
  onInitialZoomComplete?: () => void;
}

// Coordinates are now stored directly in standard [longitude, latitude] degrees.

function getLineColor(lineId: LineId): string {
  return LINE_MAP[lineId]?.color ?? '#888';
}

const customRenderer = typeof window !== 'undefined' ? L.canvas({ padding: 0.5 }) : undefined;

// ─── Map event listener component (inside MapContainer) ─────────────────────

function MapWatcher({
  onMapReady,
}: {
  onMapReady: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  return null;
}

// ─── Main exported component ─────────────────────────────────────────────────

const MAP_CENTER: [number, number] = [-33.87, 151.07];
const MAP_ZOOM = 11;
const MAP_STYLE: React.CSSProperties = { width: '100%', height: '100%', background: '#e4e9f0' };

// Module-level cache for Leaflet DivIcon instances to prevent visual flashing and ref-in-render lint errors.
const iconCache = new Map<string, L.DivIcon>();

interface RouteShape {
  route_short_name: string;
  route_color: string;
  shape_id?: string;
  json_geometry: {
    type: 'LineString' | 'MultiLineString';
    coordinates: number[][] | number[][][];
  };
}

export default function GameMap({
  startId,
  targetId,
  guessedIds,
  optimalPath,
  isComplete,
  wrongGuesses,
  tripLines,
  tripPath,
  hardMode = false,
  darkMap = false,
  hoveredStationId = null,
  mode = 'daily',
  onInitialZoomComplete,
}: GameMapProps) {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [routeShapes, setRouteShapes] = useState<RouteShape[]>([]);
  const [hasZoomedInitial, setHasZoomedInitial] = useState(false);

  // Auto-center and zoom to fit the entire route/path when completed or loaded
  useEffect(() => {
    if (!mapInstance || !isComplete || !tripPath || tripPath.length === 0) return;
    mapInstance.invalidateSize();
    const points = tripPath.map(id => STATION_MAP.get(id)).filter(Boolean) as Station[];
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
      const paddingVal: [number, number] = (isMobile || isIOS) ? [50, 130] : [50, 50];
      mapInstance.flyToBounds(bounds, { padding: paddingVal, duration: 0.8 });
    }
  }, [mapInstance, isComplete, tripPath]);

  // Auto-center and zoom to fit start and target stations when they change or when the mode changes
  useEffect(() => {
    if (!mapInstance || isComplete) return;
    mapInstance.invalidateSize();
    const startStation = STATION_MAP.get(startId);
    const targetStation = STATION_MAP.get(targetId);
    if (startStation && targetStation) {
      const bounds = L.latLngBounds([
        [startStation.lat, startStation.lng],
        [targetStation.lat, targetStation.lng]
      ]);
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
      const paddingVal: [number, number] = (isMobile || isIOS) ? [60, 140] : [100, 100];
      const maxZoomVal = (isMobile || isIOS) ? 12 : 13;

      mapInstance.flyToBounds(bounds, { padding: paddingVal, maxZoom: maxZoomVal, duration: 0.8 });

      if (!hasZoomedInitial && onInitialZoomComplete) {
        setHasZoomedInitial(true);
        setTimeout(() => {
          onInitialZoomComplete();
        }, 1300); // 0.8s flight duration + 0.5s wait
      }
    }
  }, [mapInstance, mode, startId, targetId, isComplete, hasZoomedInitial, onInitialZoomComplete]);


  useEffect(() => {
    fetch('/sydneytrainsdata.json')
      .then(res => res.json())
      .then(data => setRouteShapes(data))
      .catch(err => console.error("Error loading route shapes:", err));
  }, []);

  useEffect(() => {
    iconCache.clear();
  }, [startId, targetId]);

  const handleMapReady = useCallback((map: L.Map) => {
    setMapInstance(prev => {
      if (prev === map) return prev;
      return map;
    });
  }, []);

  const getGuessedIcon = (id: string, name: string, color: string, isHovered = false) => {
    const cacheKey = `guessed-${id}-${color}-${isHovered ? 'hovered' : 'normal'}`;
    if (!iconCache.has(cacheKey)) {
      iconCache.set(cacheKey, L.divIcon({
        className: 'custom-station-marker',
        html: `
          <div class="relative flex items-center justify-center pointer-events-none ${isHovered ? 'scale-125 transition-transform' : 'marker-bounce'}">
            <!-- Halo -->
            <div class="absolute rounded-full ${isHovered ? 'w-[36px] h-[36px] opacity-40 animate-pulse' : 'w-[24px] h-[24px] opacity-20'}" style="background-color: ${color};"></div>
            <!-- Main dot -->
            <div class="${isHovered ? 'w-[18px] h-[18px]' : 'w-[14px] h-[14px]'} rounded-full transition-all" style="background-color: ${color}; border: 1.5px solid #f8fafc;"></div>
            <!-- Label -->
            <div class="absolute bottom-[20px] whitespace-nowrap text-center font-black ${isHovered ? 'text-[11px] px-2 py-1 shadow-2xl scale-110' : 'text-[10px] px-1.5 py-0.5 shadow-lg'} rounded border" style="color: #0f172a; background-color: #ffffff; border-color: ${isHovered ? color : '#cbd5e1'}; font-family: 'Plus Jakarta Sans', sans-serif;">
              ${name}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }));
    }
    return iconCache.get(cacheKey)!;
  };

  const getWrongIcon = (id: string, name: string) => {
    const cacheKey = `wrong-${id}`;
    if (!iconCache.has(cacheKey)) {
      iconCache.set(cacheKey, L.divIcon({
        className: 'custom-station-marker opacity-40',
        html: `
          <div class="relative flex items-center justify-center pointer-events-none marker-bounce">
            <!-- Main dot in grey -->
            <div class="w-[10px] h-[10px] rounded-full bg-gray-500" style="border: 1.5px solid #f8fafc;"></div>
            <!-- Label in grey -->
            <div class="absolute bottom-[14px] whitespace-nowrap text-center font-bold text-[9px] px-1.5 py-0.5 rounded shadow-lg" style="color: #475569; background-color: #ffffff; border: 1px solid #cbd5e1; font-family: 'Plus Jakarta Sans', sans-serif;">
              ${name}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }));
    }
    return iconCache.get(cacheKey)!;
  };

  const getEndpointIcon = (id: string, name: string, color: string, isHovered = false) => {
    const cacheKey = `endpoint-${id}-${color}-${isHovered ? 'hovered' : 'normal'}`;
    if (!iconCache.has(cacheKey)) {
      iconCache.set(cacheKey, L.divIcon({
        className: 'custom-endpoint-marker',
        html: `
          <div class="relative flex items-center justify-center pointer-events-none ${isHovered ? 'scale-125 transition-transform' : ''}">
            <!-- Glow halo -->
            <div class="absolute rounded-full ${isHovered ? 'w-[36px] h-[36px] opacity-40 animate-pulse' : 'w-[24px] h-[24px] opacity-20'}" style="background-color: ${color};"></div>
            <!-- Main dot -->
            <div class="${isHovered ? 'w-[20px] h-[20px]' : 'w-[16px] h-[16px]'} rounded-full transition-all" style="background-color: ${color}; border: 2px solid #f8fafc;"></div>
            <!-- Station Name Container -->
            <div class="absolute bottom-[22px] flex flex-col items-center whitespace-nowrap">
              <div class="font-extrabold ${isHovered ? 'text-[11.5px] px-2 py-1 border-2' : 'text-[10.5px] px-1.5 py-0.5 border-1.5'} rounded shadow-lg" style="color: #0f172a; background-color: #ffffff; border-color: ${isHovered ? color : '#cbd5e1'}; font-family: 'Plus Jakarta Sans', sans-serif;">
                ${name}
              </div>
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }));
    }
    return iconCache.get(cacheKey)!;
  };

  const revealedSet = useMemo(() => {
    const set = new Set<string>();
    set.add(startId);
    set.add(targetId);

    const stationsToReveal = (isComplete && optimalPath) ? optimalPath : guessedIds;
    for (const id of stationsToReveal) {
      set.add(id);
    }
    return set;
  }, [startId, targetId, guessedIds, isComplete, optimalPath]);

  const pathSequence = useMemo(() => {
    if (isComplete && optimalPath) {
      return optimalPath;
    }
    return tripPath || [];
  }, [isComplete, optimalPath, tripPath]);

  const activePolylines = useMemo(() => {
    if (routeShapes.length === 0 || !tripLines || pathSequence.length === 0) return [];

    const result: Array<{ coords: [number, number][]; color: string; lineId: string }> = [];

    const distance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const dLat = lat1 - lat2;
      const dLng = lng1 - lng2;
      return Math.sqrt(dLat * dLat + dLng * dLng);
    };

    // Determine which adjacent pairs along the path should be shown.
    // Between two consecutive revealed stations, draw the full segment
    // ONLY if all intermediate stations share a common trip line (no transfer).
    // If a line change occurs in between, wait for the transfer station to be guessed.
    const pairsToShow: Array<[string, string]> = [];

    // Find indices of revealed stations in the path
    const revealedIndices: number[] = [];
    for (let i = 0; i < pathSequence.length; i++) {
      if (revealedSet.has(pathSequence[i])) {
        revealedIndices.push(i);
      }
    }

    // For each consecutive pair of revealed stations...
    for (let r = 0; r < revealedIndices.length - 1; r++) {
      const fromIdx = revealedIndices[r];
      const toIdx = revealedIndices[r + 1];

      // If hardMode is true, only show the segment if the two revealed stations are physically adjacent
      if (hardMode && toIdx > fromIdx + 1) {
        continue;
      }

      // Collect all stations in this segment (inclusive)
      const segmentStationIds: string[] = [];
      for (let i = fromIdx; i <= toIdx; i++) {
        segmentStationIds.push(pathSequence[i]);
      }

      // Find trip lines common to ALL stations in this segment.
      // If at least one common trip line exists → no transfer needed → show.
      let commonLines: Set<LineId> = new Set(
        STATION_MAP.get(segmentStationIds[0])?.lines.filter(l => tripLines!.includes(l)) ?? []
      );
      for (let i = 1; i < segmentStationIds.length; i++) {
        const stLines = new Set(
          STATION_MAP.get(segmentStationIds[i])?.lines.filter(l => tripLines!.includes(l)) ?? []
        );
        commonLines = new Set([...commonLines].filter(l => stLines.has(l)));
        if (commonLines.size === 0) break; // early exit
      }

      if (commonLines.size > 0) {
        // All on the same line → show all adjacent pairs in this segment
        for (let i = fromIdx; i < toIdx; i++) {
          pairsToShow.push([pathSequence[i], pathSequence[i + 1]]);
        }
      }
      // Otherwise: line change in between, transfer station not guessed → don't show
    }

    // Map each adjacent pair in pathSequence to its corresponding stepLine
    const stepLines = getMinTransferLines(pathSequence, tripLines);
    const pairToLine = new Map<string, LineId>();
    for (let i = 0; i < pathSequence.length - 1; i++) {
      const from = pathSequence[i];
      const to = pathSequence[i + 1];
      const line = stepLines[i];
      if (line) {
        pairToLine.set(`${from}|${to}`, line);
        pairToLine.set(`${to}|${from}`, line);
      }
    }

    // Track which pair+line combos have already been drawn to avoid duplicates
    // (sydneytrainsdata.json has multiple shapes per line: both directions, variants)
    const drawnPairs = new Set<string>();

    for (const pair of pairsToShow) {
      const lineId = pairToLine.get(`${pair[0]}|${pair[1]}`);
      if (!lineId) continue;

      const pairKey = `${pair[0]}|${pair[1]}|${lineId}`;
      if (drawnPairs.has(pairKey)) continue;

      let bestSliced: [number, number][] | null = null;
      let bestScore = Infinity; // Lower is better (minDA + minDB)

      const evaluateAndSlice = (rawCoords: number[][]) => {
        const coords = rawCoords.map((c) => [c[1], c[0]] as [number, number]);
        const stationA = STATION_MAP.get(pair[0]);
        const stationB = STATION_MAP.get(pair[1]);
        if (!stationA || !stationB) return null;

        if (!stationA.lines.includes(lineId) || !stationB.lines.includes(lineId)) {
          return null;
        }

        const candidatesA: number[] = [];
        const candidatesB: number[] = [];
        for (let i = 0; i < coords.length; i++) {
          const dA = distance(stationA.lat, stationA.lng, coords[i][0], coords[i][1]);
          if (dA < 0.005) {
            candidatesA.push(i);
          }
          const dB = distance(stationB.lat, stationB.lng, coords[i][0], coords[i][1]);
          if (dB < 0.005) {
            candidatesB.push(i);
          }
        }

        if (candidatesA.length === 0 || candidatesB.length === 0) {
          return null;
        }

        let bestSlice: [number, number][] | null = null;
        let bestPathLength = Infinity;
        let bestScoreLocal = Infinity;

        const directDist = distance(stationA.lat, stationA.lng, stationB.lat, stationB.lng);

        for (const idxA of candidatesA) {
          for (const idxB of candidatesB) {
            const minIdx = Math.min(idxA, idxB);
            const maxIdx = Math.max(idxA, idxB);
            if (maxIdx - minIdx < 1) continue;

            const sliced = coords.slice(minIdx, maxIdx + 1);

            let pathLength = 0;
            for (let k = 0; k < sliced.length - 1; k++) {
              pathLength += distance(sliced[k][0], sliced[k][1], sliced[k + 1][0], sliced[k + 1][1]);
            }

            if (pathLength <= 2.0 * directDist + 0.005) {
              const score = distance(stationA.lat, stationA.lng, coords[idxA][0], coords[idxA][1]) +
                distance(stationB.lat, stationB.lng, coords[idxB][0], coords[idxB][1]);
              if (pathLength < bestPathLength) {
                bestPathLength = pathLength;
                bestSlice = sliced;
                bestScoreLocal = score;
              }
            }
          }
        }

        if (bestSlice) {
          return { sliced: bestSlice, score: bestScoreLocal };
        }
        return null;
      };

      // 1st pass: search shapes belonging to this specific line
      for (const shape of routeShapes) {
        if (shape.route_short_name !== lineId) continue;

        // Filter out T1 shapes that actually go via Epping (T9 direction)
        if (lineId === 'T1') {
          const geom = shape.json_geometry;
          const isT9Shape = (rawCoords: number[][]) => {
            return rawCoords.some(c => {
              const lat = c[1];
              const lng = c[0];
              const dLat = lat - (-33.77284);
              const dLng = lng - 151.08217;
              return Math.sqrt(dLat * dLat + dLng * dLng) < 0.015;
            });
          };
          let passesT9 = false;
          if (geom.type === 'LineString') {
            passesT9 = isT9Shape(geom.coordinates as number[][]);
          } else if (geom.type === 'MultiLineString') {
            passesT9 = (geom.coordinates as number[][][]).some(part => isT9Shape(part));
          }
          if (passesT9) continue;
        }

        // Filter out T8 shapes depending on which branch the segment is on
        if (lineId === 'T8') {
          const isAirportSegment = pair.some(id =>
            id === 'STN-INT' ||
            id === 'STN-DOM' ||
            id === 'STN-MCO' ||
            id === 'STN-GQE'
          );
          const isSydenhamSegment = pair.some(id =>
            id === 'STN-REF' ||
            id === 'STN-EKV' ||
            id === 'STN-SAP' ||
            id === 'STN-SDN'
          );

          if (isAirportSegment || isSydenhamSegment) {
            const geom = shape.json_geometry;
            const checkCoords = geom.type === 'LineString'
              ? (geom.coordinates as number[][])
              : (geom.coordinates as number[][][])[0];

            const airportStation = STATION_MAP.get('STN-INT');
            let passesAirport = false;
            if (airportStation) {
              for (const c of checkCoords) {
                const lat = c[1];
                const lng = c[0];
                const dLat = lat - airportStation.lat;
                const dLng = lng - airportStation.lng;
                if (Math.sqrt(dLat * dLat + dLng * dLng) < 0.005) {
                  passesAirport = true;
                  break;
                }
              }
            }
            if (isAirportSegment && !passesAirport) continue;
            if (isSydenhamSegment && passesAirport) continue;
          }
        }

        const geom = shape.json_geometry;

        if (geom.type === 'LineString') {
          const res = evaluateAndSlice(geom.coordinates as number[][]);
          if (res && res.score < bestScore) {
            bestScore = res.score;
            bestSliced = res.sliced;
          }
        } else if (geom.type === 'MultiLineString') {
          for (const part of (geom.coordinates as number[][][])) {
            const res = evaluateAndSlice(part);
            if (res && res.score < bestScore) {
              bestScore = res.score;
              bestSliced = res.sliced;
            }
          }
        }
      }

      // 2nd pass: fallback if no shape found for the specific line
      if (!bestSliced) {
        for (const shape of routeShapes) {
          if (shape.route_short_name === lineId) continue;

          const geom = shape.json_geometry;
          if (geom.type === 'LineString') {
            const res = evaluateAndSlice(geom.coordinates as number[][]);
            if (res && res.score < bestScore) {
              bestScore = res.score;
              bestSliced = res.sliced;
            }
          } else if (geom.type === 'MultiLineString') {
            for (const part of (geom.coordinates as number[][][])) {
              const res = evaluateAndSlice(part);
              if (res && res.score < bestScore) {
                bestScore = res.score;
                bestSliced = res.sliced;
              }
            }
          }
        }
      }

      if (bestSliced) {
        const color = LINE_MAP[lineId]?.color ?? '#888';
        const stationA = STATION_MAP.get(pair[0])!;
        const stationB = STATION_MAP.get(pair[1])!;

        const snapped = [...bestSliced];
        const distToStartA = distance(stationA.lat, stationA.lng, snapped[0][0], snapped[0][1]);
        const distToStartB = distance(stationB.lat, stationB.lng, snapped[0][0], snapped[0][1]);
        if (distToStartA < distToStartB) {
          snapped[0] = [stationA.lat, stationA.lng];
          snapped[snapped.length - 1] = [stationB.lat, stationB.lng];
        } else {
          snapped[0] = [stationB.lat, stationB.lng];
          snapped[snapped.length - 1] = [stationA.lat, stationA.lng];
        }

        result.push({ coords: snapped, color, lineId });
        drawnPairs.add(pairKey);
      }
    }
    return result;
  }, [routeShapes, tripLines, pathSequence, revealedSet]);

  const stationLinesMap = useMemo(() => {
    return getStationLinesOnPath(pathSequence, tripLines || []);
  }, [pathSequence, tripLines]);

  const mapStyle = useMemo(() => ({
    width: '100%',
    height: '100%',
    background: darkMap ? '#0b0f19' : '#e4e9f0'
  }), [darkMap]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        zoomControl={false}
        attributionControl={true}
        style={mapStyle}
        zoomSnap={0}
        touchZoom={true}
        boxZoom={true}
        preferCanvas={true}
        renderer={customRenderer}

        scrollWheelZoom={false}
        smoothWheelZoom={true}
        smoothSensitivity={25}
      >
        {/* CartoDB Map Tiles based on darkMap and hardMode props */}
        <TileLayer
          url={hardMode
            ? (darkMap
                ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
              )
            : (darkMap
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              )
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        <MapWatcher onMapReady={handleMapReady} />

        {/* ── GEOGRAPHICAL ROUTE TRACKS (only for lines in this game) ────────── */}
        {activePolylines.map((line, idx) => {
          const edgeId = `track-${line.lineId}-${idx}`;
          return (
            <React.Fragment key={edgeId}>
              {/* Track glow underlayer */}
              <Polyline
                positions={line.coords}
                pathOptions={{
                  color: line.color,
                  weight: 8,
                  opacity: 0.2,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {/* Track sharp top layer */}
              <Polyline
                positions={line.coords}
                pathOptions={{
                  color: line.color,
                  weight: 3.5,
                  opacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </React.Fragment>
          );
        })}



        {/* ── GUESSED STATION NODES ───────────────────────────────────────── */}
        {(isComplete && optimalPath ? optimalPath.filter(id => id !== startId && id !== targetId) : guessedIds).map(id => {
          const s = STATION_MAP.get(id);
          if (!s) return null;
          const activeLine = stationLinesMap[id] || s.lines.find(l => tripLines?.includes(l)) || s.lines[0];
          const color = getLineColor(activeLine);

          const icon = getGuessedIcon(id, s.name, color, id === hoveredStationId);

          return (
            <Marker
              key={`node-${id}`}
              position={[s.lat, s.lng]}
              icon={icon}
              interactive={false}
            />
          );
        })}

        {/* ── WRONG GUESSED STATION NODES (greyed out) ────────────────────── */}
        {wrongGuesses && wrongGuesses.map(id => {
          const s = STATION_MAP.get(id);
          if (!s) return null;

          const icon = getWrongIcon(id, s.name);

          return (
            <Marker
              key={`wrong-${id}`}
              position={[s.lat, s.lng]}
              icon={icon}
              interactive={false}
            />
          );
        })}

        {/* ── ENDPOINT STATIONS (showcased neutrally as two ends) ────────── */}
        {([startId, targetId] as const).map((id) => {
          const s = STATION_MAP.get(id);
          if (!s) return null;
          const activeLine = stationLinesMap[id] || s.lines.find(l => tripLines?.includes(l)) || s.lines[0];
          const color = getLineColor(activeLine);

          const icon = getEndpointIcon(id, s.name, color, id === hoveredStationId);

          return (
            <Marker
              key={`endpoint-${id}`}
              position={[s.lat, s.lng]}
              icon={icon}
              interactive={false}
            />
          );
        })}
      </MapContainer>

      {/* Zoom controls (custom, since we disabled Leaflet's default) */}
      {mapInstance && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {[
            { label: '+', onClick: () => mapInstance.zoomIn() },
            { label: '−', onClick: () => mapInstance.zoomOut() },
            {
              label: '⌂',
              onClick: () => mapInstance.flyTo(MAP_CENTER, MAP_ZOOM, { duration: 0.8 }),
            },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              style={{
                width: 32,
                height: 32,
                background: darkMap ? '#1e293b' : '#ffffff',
                border: darkMap ? '1px solid #334155' : '1px solid #cbd5e1',
                borderRadius: 6,
                color: darkMap ? '#94a3b8' : '#475569',
                cursor: 'pointer',
                fontSize: btn.label === '⌂' ? 14 : 18,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
                transition: 'color 0.15s, background-color 0.15s',
              }}
              onMouseEnter={e => {
                const el = e.target as HTMLButtonElement;
                el.style.color = darkMap ? '#ffffff' : '#0f172a';
                el.style.backgroundColor = darkMap ? '#334155' : '#f1f5f9';
              }}
              onMouseLeave={e => {
                const el = e.target as HTMLButtonElement;
                el.style.color = darkMap ? '#94a3b8' : '#475569';
                el.style.backgroundColor = darkMap ? '#1e293b' : '#ffffff';
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Custom Styles and Animations */}
      <style>{`
        .leaflet-control-attribution {
          background: rgba(255, 255, 255, 0.8) !important;
          color: #475569 !important;
          font-size: 10px !important;
          backdrop-filter: blur(4px);
          border-left: 1px solid #cbd5e1;
          border-top: 1px solid #cbd5e1;
        }
        .leaflet-control-attribution a { color: #0f172a !important; }
        .leaflet-container { font-family: 'Plus Jakarta Sans', sans-serif; }

        /* Remove default Leaflet icon styling */
        .custom-station-marker, .custom-endpoint-marker {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }

        .animate-draw-track {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawTrack 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes drawTrack {
          to { stroke-dashoffset: 0; }
        }

        .marker-bounce {
          animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }

        @keyframes bounceIn {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }

        .endpoint-pulse {
          animation: endpointPulse 2s ease-in-out infinite;
        }

        @keyframes endpointPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50%       { transform: scale(1.25); opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
