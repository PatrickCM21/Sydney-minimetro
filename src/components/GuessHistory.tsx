import React, { useMemo } from 'react';
import { STATION_MAP, LINE_MAP } from '@/lib/networkData';
import { getStationLinesOnPath } from '@/lib/pathfinding';
import type { LineId } from '@/types';

interface GuessHistoryProps {
  guessedIds: string[];
  startId: string;
  targetId: string;
  userPath: string[] | null;
  isComplete: boolean;
  wrongGuesses: string[];
  tripPath: string[];
  tripLines: LineId[];
}

interface StationRowProps {
  id: string;
  isEndpoint?: boolean;
  isRevealed?: boolean;
  isGuessed?: boolean;
  tripLines?: LineId[];
  lineId?: LineId;
}

function StationRow({
  id,
  isEndpoint,
  isRevealed,
  isGuessed,
  tripLines,
  lineId,
}: StationRowProps) {
  const station = STATION_MAP.get(id);
  if (!station) return null;

  if (!isRevealed && !isEndpoint) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-game-surface/20 border border-dashed border-game-border/60 opacity-60">
        <div className="shrink-0 w-6 text-center text-gray-600 font-mono text-xs">?</div>
        <span
          className="line-badge shrink-0 bg-gray-800 text-gray-500 border border-gray-700/50"
          style={{ fontSize: '9px', minWidth: '1.6rem', padding: '1px 4px' }}
        >
          ???
        </span>
        <span className="flex-1 truncate text-gray-500 font-medium italic">
          Hidden Station
        </span>
      </div>
    );
  }

  const activeLine = lineId ?? (station.lines.find(l => tripLines?.includes(l)) ?? station.lines[0]);
  const line = LINE_MAP[activeLine];

  const color = line?.color ?? '#3b82f6';

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-300
        ${isEndpoint
          ? 'border'
          : isGuessed
            ? 'bg-game-surface/60 border border-game-border/40'
            : 'bg-red-950/10 border border-red-900/20 opacity-70'}
        animate-fade-in
      `}
      style={isEndpoint ? { backgroundColor: `${color}15`, borderColor: `${color}33` } : undefined}
    >
      {/* Indicator */}
      <div className="shrink-0 w-6 text-center">
        {isEndpoint ? (
          <span
            className="text-[9px] font-black px-1 py-0.5 rounded border border-opacity-30"
            style={{
              color: color,
              backgroundColor: `${color}1A`,
              borderColor: `${color}4D`
            }}
          >
            END
          </span>
        ) : isGuessed ? (
          <span className="text-green-500 font-bold">✓</span>
        ) : (
          <span className="text-red-500 font-bold">✕</span>
        )}
      </div>

      {/* Line badge */}
      <span
        className="line-badge shrink-0 font-bold"
        style={{ backgroundColor: line?.color ?? '#888', color: line?.textColor ?? '#fff' }}
      >
        {activeLine}
      </span>

      {/* Station name */}
      <span className={`flex-1 truncate font-medium ${isEndpoint ? 'text-game-text' : isGuessed ? 'text-game-text-muted' : 'text-game-text-muted/50'}`}>
        {station.name}
      </span>

      {/* Missed badge */}
      {!isEndpoint && !isGuessed && (
        <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-red-950/30 border border-red-900/30 text-red-400 font-bold">
          Missed
        </span>
      )}
    </div>
  );
}

export default function GuessHistory({
  guessedIds,
  startId,
  targetId,
  isComplete,
  wrongGuesses,
  tripPath,
  tripLines,
}: GuessHistoryProps) {
  const guessedSet = new Set(guessedIds);

  const stationLinesMap = useMemo(() => {
    return getStationLinesOnPath(tripPath, tripLines || []);
  }, [tripPath, tripLines]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Timeline Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-game-text">Route Timeline</h2>
          <span className="text-xs text-game-text-muted font-mono">
            {guessedIds.length} / {tripPath.length > 2 ? tripPath.length - 2 : 0} guessed
          </span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll pr-1 flex flex-col gap-1.5">
          {tripPath.map((id, index) => {
            const isEndpoint = id === startId || id === targetId;
            const isRevealed = isComplete || guessedSet.has(id);
            return (
              <React.Fragment key={id}>
                <StationRow
                  id={id}
                  isEndpoint={isEndpoint}
                  isRevealed={isRevealed}
                  isGuessed={guessedSet.has(id)}
                  tripLines={tripLines}
                  lineId={stationLinesMap[id]}
                />
                {index < tripPath.length - 1 && (
                  <div className="flex justify-center my-0.5">
                    <div className="w-0.5 h-3 bg-gradient-to-b from-gray-700 to-gray-800" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Wrong Guesses Section */}
      <div className="h-32 shrink-0 border-t border-game-border/60 pt-3 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-game-text">Wrong Guesses</h2>
          <span className="text-xs text-game-text-muted font-mono">{wrongGuesses.length} / 5</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll pr-1 flex flex-col gap-1.5">
          {wrongGuesses.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-600 text-xs italic">No wrong guesses yet</p>
            </div>
          ) : (
            wrongGuesses.map((id) => {
              const station = STATION_MAP.get(id);
              if (!station) return null;

              // Check if on correct line
              const onCorrectLine = station.lines.some(l => tripLines.includes(l));
              const activeLine = station.lines.find(l => tripLines.includes(l)) ?? station.lines[0];
              const line = LINE_MAP[activeLine];

              return (
                <div
                  key={id}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border
                    ${onCorrectLine
                      ? 'bg-amber-950/20 border-amber-900/30 text-amber-300'
                      : 'bg-red-950/20 border-red-900/30 text-red-400'}
                    animate-fade-in
                  `}
                >
                  <span className="shrink-0 font-bold">✕</span>

                  {/* Line badge */}
                  <span
                    className="line-badge shrink-0"
                    style={{
                      backgroundColor: line?.color ?? '#888',
                      color: line?.textColor ?? '#fff',
                      fontSize: '9px',
                      padding: '0.5px 3px'
                    }}
                  >
                    {activeLine}
                  </span>

                  <span className="flex-1 truncate font-medium">
                    {station.name}
                  </span>

                  <span className="shrink-0 text-[9px] uppercase tracking-wider px-1 py-0.2 rounded bg-black/30 border border-white/5 font-bold">
                    {onCorrectLine ? 'Off Path' : 'Wrong Line'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
