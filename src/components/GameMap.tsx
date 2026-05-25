'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { EDGES, LINE_MAP, STATION_MAP } from '@/lib/networkData';
import type { Station, Edge, LineId } from '@/types';

interface GameMapProps {
  startId: string;
  targetId: string;
  guessedIds: string[];     // all guessed station ids (not including start/target)
  optimalPath?: string[];   // shown at game end
  userPath?: string[];      // shown at game end
  isComplete: boolean;
}

const VIEWBOX_W = 1400;
const VIEWBOX_H = 900;
const STATION_R = 5;
const ACTIVE_R = 8;
const ENDPOINT_R = 11;

function getLineColor(lineId: LineId): string {
  return LINE_MAP[lineId]?.color ?? '#666';
}

export default function GameMap({
  startId,
  targetId,
  guessedIds,
  optimalPath,
  userPath,
  isComplete,
}: GameMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const isPanning = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });

  // Set of active station ids (start + target + guessed)
  const activeIds = new Set([startId, targetId, ...guessedIds]);

  // Determine which edges to reveal
  // An edge is revealed if BOTH endpoints are in activeIds
  const revealedEdges = EDGES.filter(e =>
    activeIds.has(e.from) && activeIds.has(e.to)
  );

  // Pan & zoom handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    lastPan.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPan.current.x;
    const dy = e.clientY - lastPan.current.y;
    lastPan.current = { x: e.clientX, y: e.clientY };
    setPan(p => ({ x: p.x + dx / zoom, y: p.y + dy / zoom }));
  }, [zoom]);

  const onMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.88;
    setZoom(z => Math.min(5, Math.max(0.3, z * factor)));
  }, []);

  // Touch pan support
  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && lastTouch.current) {
      const dx = e.touches[0].clientX - lastTouch.current.x;
      const dy = e.touches[0].clientY - lastTouch.current.y;
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setPan(p => ({ x: p.x + dx / zoom, y: p.y + dy / zoom }));
    }
  }, [zoom]);
  const onTouchEnd = useCallback(() => { lastTouch.current = null; }, []);

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };



  // Overlay path rendering (on game end)
  const renderPathLine = (path: string[], colorClass: string, opacity: number) => {
    if (path.length < 2) return null;
    const points = path.map(id => STATION_MAP.get(id)).filter(Boolean) as Station[];
    if (points.length < 2) return null;
    const d = points.map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`).join(' ');
    return (
      <path
        key={colorClass}
        d={d}
        fill="none"
        stroke={colorClass}
        strokeWidth="6"
        strokeOpacity={opacity}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="12 6"
        style={{ transition: 'all 0.5s ease' }}
      />
    );
  };

  const transform = `translate(${pan.x * zoom + (VIEWBOX_W / 2) * (zoom - 1) * -1} ${pan.y * zoom + (VIEWBOX_H / 2) * (zoom - 1) * -1}) scale(${zoom})`;

  return (
    <div className="relative w-full h-full map-container bg-game-bg select-none overflow-hidden">
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
        <button
          onClick={() => setZoom(z => Math.min(5, z * 1.25))}
          className="w-8 h-8 glass-panel rounded flex items-center justify-center text-gray-400 hover:text-white transition-colors text-lg font-bold"
        >+</button>
        <button
          onClick={() => setZoom(z => Math.max(0.3, z * 0.8))}
          className="w-8 h-8 glass-panel rounded flex items-center justify-center text-gray-400 hover:text-white transition-colors text-lg font-bold"
        >−</button>
        <button
          onClick={resetView}
          className="w-8 h-8 glass-panel rounded flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xs"
          title="Reset view"
        >⌂</button>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <g transform={transform}>
          {/* Map is dark until stations are connected — no ghost layer */}

          {/* REVEALED: active edges with color and animation */}
          {revealedEdges.map((edge, i) => {
            const fromStation = STATION_MAP.get(edge.from);
            const toStation = STATION_MAP.get(edge.to);
            if (!fromStation || !toStation) return null;
            const color = getLineColor(edge.line);
            return (
              <line
                key={`active-edge-${i}`}
                x1={fromStation.x}
                y1={fromStation.y}
                x2={toStation.x}
                y2={toStation.y}
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                className="track-line"
                style={{
                  filter: `drop-shadow(0 0 4px ${color})`,
                }}
              />
            );
          })}

          {/* End-game overlay paths */}
          {isComplete && optimalPath && renderPathLine(optimalPath, '#22c55e', 0.7)}
          {isComplete && userPath && renderPathLine(userPath, '#f59e0b', 0.7)}

          {/* REVEALED: active station nodes (guessed, not endpoint) */}
          {guessedIds.map(id => {
            const station = STATION_MAP.get(id);
            if (!station) return null;
            const primaryLine = station.lines[0];
            const color = getLineColor(primaryLine);
            return (
              <g key={`active-${id}`} style={{ animation: 'bounceIn 0.5s cubic-bezier(0.68,-0.55,0.265,1.55) forwards' }}>
                <circle cx={station.x} cy={station.y} r={ACTIVE_R + 4} fill={color} fillOpacity="0.2" />
                <circle
                  cx={station.x}
                  cy={station.y}
                  r={ACTIVE_R}
                  fill={color}
                  stroke="#0a0c12"
                  strokeWidth="2"
                  style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                />
              </g>
            );
          })}

          {/* ENDPOINTS: start and target stations (always visible) */}
          {[startId, targetId].map((id, idx) => {
            const station = STATION_MAP.get(id);
            if (!station) return null;
            const isStart = idx === 0;
            const primaryLine = station.lines[0];
            const color = getLineColor(primaryLine);
            const endpointColor = isStart ? '#22c55e' : '#ef4444';
            return (
              <g key={`endpoint-${id}`}>
                {/* Pulsing ring */}
                <circle
                  cx={station.x}
                  cy={station.y}
                  r={ENDPOINT_R + 8}
                  fill="none"
                  stroke={endpointColor}
                  strokeWidth="2"
                  strokeOpacity="0.5"
                  style={{ animation: 'stationPulse 2.5s ease-in-out infinite' }}
                />
                {/* Outer glow */}
                <circle cx={station.x} cy={station.y} r={ENDPOINT_R + 2} fill={endpointColor} fillOpacity="0.25" />
                {/* Main circle */}
                <circle
                  cx={station.x}
                  cy={station.y}
                  r={ENDPOINT_R}
                  fill={endpointColor}
                  stroke="#0a0c12"
                  strokeWidth="2.5"
                  style={{ filter: `drop-shadow(0 0 8px ${endpointColor})` }}
                />
                {/* Label */}
                <text
                  x={station.x}
                  y={station.y - ENDPOINT_R - 8}
                  textAnchor="middle"
                  fill={endpointColor}
                  fontSize="11"
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                  fontWeight="700"
                  style={{ filter: `drop-shadow(0 1px 3px rgba(0,0,0,0.8))` }}
                >
                  {isStart ? '▶ START' : '★ TARGET'}
                </text>
                <text
                  x={station.x}
                  y={station.y - ENDPOINT_R - 20}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                  fontWeight="600"
                  style={{ filter: `drop-shadow(0 1px 3px rgba(0,0,0,0.9))` }}
                >
                  {station.name}
                </text>
              </g>
            );
          })}

          {/* Active station labels (only for guessed) */}
          {guessedIds.map(id => {
            const station = STATION_MAP.get(id);
            if (!station) return null;
            const primaryLine = station.lines[0];
            const color = getLineColor(primaryLine);
            return (
              <text
                key={`label-${id}`}
                x={station.x}
                y={station.y - ACTIVE_R - 6}
                textAnchor="middle"
                fill={color}
                fontSize="9"
                fontFamily="'Plus Jakarta Sans', sans-serif"
                fontWeight="600"
                style={{ filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.9))` }}
              >
                {station.name}
              </text>
            );
          })}
        </g>
      </svg>

      {/* Pan hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-gray-600 pointer-events-none">
        Drag to pan · Scroll to zoom
      </div>
    </div>
  );
}
