'use client';

import React from 'react';
import { STATION_MAP, LINE_MAP } from '@/lib/networkData';
import type { LineId } from '@/types';

interface GuessHistoryProps {
  guessedIds: string[];
  startId: string;
  targetId: string;
  userPath: string[] | null;
  isComplete: boolean;
}

function StationRow({
  id,
  index,
  label,
  isEndpoint,
  isOnUserPath,
  isComplete,
}: {
  id: string;
  index?: number;
  label?: string;
  isEndpoint?: boolean;
  isOnUserPath?: boolean;
  isComplete: boolean;
}) {
  const station = STATION_MAP.get(id);
  if (!station) return null;
  const primaryLine = station.lines[0];
  const line = LINE_MAP[primaryLine];

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-300
        ${isEndpoint ? 'bg-game-border/60' : 'bg-game-surface/60'}
        ${isOnUserPath && isComplete ? 'ring-1 ring-amber-500/50' : ''}
        ${isEndpoint ? '' : 'animate-fade-in'}
      `}
    >
      {/* Stop number or label */}
      <div className="shrink-0 w-6 text-center">
        {label ? (
          <span className="text-xs font-bold" style={{ color: isEndpoint ? '#fff' : '#9ca3af' }}>
            {label}
          </span>
        ) : (
          <span className="text-xs text-gray-500 font-mono">#{index}</span>
        )}
      </div>

      {/* Line badge */}
      <span
        className="line-badge shrink-0"
        style={{ backgroundColor: line.color, color: line.textColor }}
      >
        {primaryLine}
      </span>

      {/* Station name */}
      <span className={`flex-1 truncate font-medium ${isEndpoint ? 'text-white' : 'text-gray-300'}`}>
        {station.name}
      </span>

      {/* Path indicator */}
      {isOnUserPath && isComplete && (
        <span className="shrink-0 text-amber-400 text-xs">✓</span>
      )}
    </div>
  );
}

export default function GuessHistory({
  guessedIds,
  startId,
  targetId,
  userPath,
  isComplete,
}: GuessHistoryProps) {
  const userPathSet = new Set(userPath ?? []);
  const totalGuesses = guessedIds.length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-300">Your Guesses</h2>
        <span className="text-xs text-gray-500 font-mono">{totalGuesses} stop{totalGuesses !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex flex-col gap-1.5 overflow-y-auto custom-scroll flex-1 pr-0.5">
        {/* Start station */}
        <StationRow
          id={startId}
          label="S"
          isEndpoint
          isOnUserPath={userPathSet.has(startId)}
          isComplete={isComplete}
        />

        {/* Divider */}
        {guessedIds.length > 0 && (
          <div className="h-px bg-game-border/50 mx-3" />
        )}

        {/* Guesses */}
        {guessedIds.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-600 text-xs text-center leading-relaxed px-4">
              Type a station above to<br />start building your path
            </p>
          </div>
        ) : (
          guessedIds.map((id, i) => (
            <StationRow
              key={id}
              id={id}
              index={i + 1}
              isOnUserPath={userPathSet.has(id)}
              isComplete={isComplete}
            />
          ))
        )}

        {/* Divider before target */}
        {isComplete && (
          <div className="h-px bg-game-border/50 mx-3" />
        )}

        {/* Target (shown when game is complete or always at bottom) */}
        <StationRow
          id={targetId}
          label="T"
          isEndpoint
          isOnUserPath={userPathSet.has(targetId)}
          isComplete={isComplete}
        />
      </div>
    </div>
  );
}
