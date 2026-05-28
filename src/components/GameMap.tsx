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

import { LINE_MAP, STATION_MAP } from '@/lib/networkData';
import type { LineId } from '@/types';

interface GameMapProps {
  startId: string;
  targetId: string;
  guessedIds: string[];
  optimalPath?: string[];
  isComplete: boolean;
  wrongGuesses?: string[];
  tripLines?: LineId[];
}

function mercatorToLatLng(x: number, y: number): [number, number] {
  const r = 6378137; // pseudo-mercator earth radius
  const lng = (x / r) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / r)) - Math.PI / 2) * (180 / Math.PI);
  return [lat, lng];
}

function getLineColor(lineId: LineId): string {
  return LINE_MAP[lineId]?.color ?? '#888';
}

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
}: GameMapProps) {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [routeShapes, setRouteShapes] = useState<RouteShape[]>([]);

  useEffect(() => {
    fetch('/sydneytrains.json')
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

  const getGuessedIcon = (id: string, name: string, color: string) => {
    const cacheKey = `guessed-${id}-${color}`;
    if (!iconCache.has(cacheKey)) {
      iconCache.set(cacheKey, L.divIcon({
        className: 'custom-station-marker',
        html: `
          <div class="relative flex items-center justify-center pointer-events-none marker-bounce">
            <!-- Halo -->
            <div class="absolute w-[24px] h-[24px] rounded-full opacity-20" style="background-color: ${color};"></div>
            <!-- Main dot -->
            <div class="w-[14px] h-[14px] rounded-full" style="background-color: ${color}; border: 1.5px solid #f8fafc;"></div>
            <!-- Label -->
            <div class="absolute bottom-[18px] whitespace-nowrap text-center font-bold text-[10px] px-1.5 py-0.5 rounded shadow-lg" style="color: #0f172a; background-color: #ffffff; border: 1px solid #cbd5e1; font-family: 'Plus Jakarta Sans', sans-serif;">
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

  const getEndpointIcon = (id: string, name: string, color: string) => {
    const cacheKey = `endpoint-${id}-${color}`;
    if (!iconCache.has(cacheKey)) {
      iconCache.set(cacheKey, L.divIcon({
        className: 'custom-endpoint-marker',
        html: `
          <div class="relative flex items-center justify-center pointer-events-none">
            <!-- Glow halo -->
            <div class="absolute w-[24px] h-[24px] rounded-full opacity-20" style="background-color: ${color};"></div>
            <!-- Main dot -->
            <div class="w-[16px] h-[16px] rounded-full" style="background-color: ${color}; border: 2px solid #f8fafc;"></div>
            <!-- Station Name Container -->
            <div class="absolute bottom-[20px] flex flex-col items-center whitespace-nowrap">
              <div class="font-extrabold text-[10.5px] px-1.5 py-0.5 rounded shadow-lg" style="color: #0f172a; background-color: #ffffff; border: 1.5px solid #cbd5e1; font-family: 'Plus Jakarta Sans', sans-serif;">
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

  const chosenStationIds = useMemo(() => {
    if (isComplete && optimalPath) {
      return optimalPath;
    }
    return [startId, targetId, ...guessedIds];
  }, [startId, targetId, guessedIds, isComplete, optimalPath]);

  const activePolylines = useMemo(() => {
    if (routeShapes.length === 0 || !tripLines) return [];
    
    const result: Array<{ coords: [number, number][]; color: string; lineId: string }> = [];
    
    const distance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const dLat = lat1 - lat2;
      const dLng = lng1 - lng2;
      return Math.sqrt(dLat * dLat + dLng * dLng);
    };

    const chosenStations = chosenStationIds
      .map(id => STATION_MAP.get(id))
      .filter((s): s is NonNullable<typeof s> => !!s);
    
    for (const shape of routeShapes) {
      const lineId = shape.route_short_name as LineId;
      if (tripLines.includes(lineId)) {
        const color = LINE_MAP[lineId]?.color ?? `#${shape.route_color}`;
        const geom = shape.json_geometry;
        
        const processCoords = (rawCoords: number[][]) => {
          const coords = rawCoords.map((c) => mercatorToLatLng(c[0], c[1]));
          
          // Find close chosen stations on this line
          const closeIndices: number[] = [];
          for (const s of chosenStations) {
            if (s.lines.includes(lineId)) {
              let minD = Infinity;
              let minIdx = -1;
              for (let i = 0; i < coords.length; i++) {
                const d = distance(s.lat, s.lng, coords[i][0], coords[i][1]);
                if (d < minD) {
                  minD = d;
                  minIdx = i;
                }
              }
              // Threshold: 0.02 degrees (~2 km)
              if (minIdx !== -1 && minD < 0.02) {
                closeIndices.push(minIdx);
              }
            }
          }
          
          if (closeIndices.length >= 2) {
            const minIdx = Math.min(...closeIndices);
            const maxIdx = Math.max(...closeIndices);
            return coords.slice(minIdx, maxIdx + 1);
          }
          return null;
        };

        if (geom.type === 'LineString') {
          const sliced = processCoords(geom.coordinates as number[][]);
          if (sliced) {
            result.push({ coords: sliced, color, lineId });
          }
        } else if (geom.type === 'MultiLineString') {
          for (const part of (geom.coordinates as number[][][])) {
            const sliced = processCoords(part);
            if (sliced) {
              result.push({ coords: sliced, color, lineId });
            }
          }
        }
      }
    }
    return result;
  }, [routeShapes, tripLines, chosenStationIds]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        zoomControl={false}
        attributionControl={true}
        style={MAP_STYLE}
      >
        {/* CartoDB Positron Map Tiles (Always Light) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
          const activeLine = s.lines.find(l => tripLines?.includes(l)) ?? s.lines[0];
          const color = getLineColor(activeLine);
          
          const icon = getGuessedIcon(id, s.name, color);

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
          const activeLine = s.lines.find(l => tripLines?.includes(l)) ?? s.lines[0];
          const color = getLineColor(activeLine);

          const icon = getEndpointIcon(id, s.name, color);

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
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                color: '#475569',
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
                el.style.color = '#0f172a';
                el.style.backgroundColor = '#f1f5f9';
              }}
              onMouseLeave={e => {
                const el = e.target as HTMLButtonElement;
                el.style.color = '#475569';
                el.style.backgroundColor = '#ffffff';
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
