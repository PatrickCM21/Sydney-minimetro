'use client';

import React, { useRef } from 'react';
import { STATION_MAP, LINE_MAP } from '@/lib/networkData';
import type { LineId } from '@/types';

interface ResultsModalProps {
  isOpen: boolean;
  startId: string;
  targetId: string;
  optimalPath: string[];
  userPath: string[] | null;
  guessedIds: string[];
  wrongGuesses: string[];
  tripLines: LineId[];
  onPlayAgain: () => void;
  onClose: () => void;
  mode: 'daily' | 'practice';
}

function PathDisplay({
  path,
  guessedIds,
  startId,
  targetId,
  tripLines,
}: {
  path: string[];
  guessedIds: string[];
  startId: string;
  targetId: string;
  tripLines: LineId[];
}) {
  const guessedSet = new Set(guessedIds);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trip Route</span>
        <span className="text-xs text-gray-500 font-mono ml-auto">
          {path.length > 2 ? path.length - 2 : 0} intermediate stops
        </span>
      </div>
      
      <div className="flex flex-wrap gap-y-3 gap-x-2 items-center bg-game-surface/40 p-4 rounded-xl border border-game-border/30">
        {path.map((id, i) => {
          const station = STATION_MAP.get(id);
          if (!station) return null;
          const activeLine = station.lines.find(l => tripLines.includes(l)) ?? station.lines[0];
          const line = LINE_MAP[activeLine];
          const isEndpoint = id === startId || id === targetId;
          const isGuessed = guessedSet.has(id);

          return (
            <React.Fragment key={id}>
              <div 
                className={`
                  flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-300
                  ${isEndpoint 
                    ? 'bg-blue-950/20 border-blue-900/30 text-white font-bold' 
                    : isGuessed 
                      ? 'bg-green-950/20 border-green-900/30 text-green-300' 
                      : 'bg-red-950/20 border-red-900/30 text-red-400 opacity-80'}
                `}
              >
                <span
                  className="line-badge text-[9px] font-bold"
                  style={{
                    backgroundColor: line?.color ?? '#888',
                    color: line?.textColor ?? '#fff',
                    padding: '0.5px 3px',
                  }}
                >
                  {activeLine}
                </span>
                <span className="truncate max-w-[120px]">{station.name}</span>
                {!isEndpoint && (
                  <span className="font-bold ml-0.5">
                    {isGuessed ? '✓' : '✕'}
                  </span>
                )}
              </div>
              {i < path.length - 1 && (
                <span className="text-gray-600 text-xs self-center">→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function ScoreBadge({ 
  guessedCount, 
  totalCount, 
  wrongCount 
}: { 
  guessedCount: number; 
  totalCount: number; 
  wrongCount: number;
}) {
  const gaveUp = guessedCount < totalCount;
  
  if (gaveUp) {
    return (
      <div className="text-center">
        <div className="text-4xl font-black text-gray-400 mb-1">
          TRIP REVEALED
        </div>
        <div className="text-gray-400 text-sm">You guessed {guessedCount} of {totalCount} stations. Try again! 🏁</div>
      </div>
    );
  }

  if (wrongCount === 0) {
    return (
      <div className="text-center">
        <div className="text-5xl font-black text-green-400 mb-1" style={{ textShadow: '0 0 30px rgba(34,197,94,0.5)' }}>
          PERFECT!
        </div>
        <div className="text-gray-400 text-sm">You guessed every station on the first try! 🎉</div>
      </div>
    );
  }
  
  if (wrongCount <= 2) {
    return (
      <div className="text-center">
        <div className="text-5xl font-black text-blue-400 mb-1" style={{ textShadow: '0 0 30px rgba(59,130,246,0.5)' }}>
          EXCELLENT!
        </div>
        <div className="text-gray-400 text-sm">Just {wrongCount} wrong guess{wrongCount !== 1 ? 'es' : ''}! 🌟</div>
      </div>
    );
  }

  if (wrongCount <= 5) {
    return (
      <div className="text-center">
        <div className="text-5xl font-black text-amber-400 mb-1" style={{ textShadow: '0 0 30px rgba(245,158,11,0.5)' }}>
          GREAT JOB!
        </div>
        <div className="text-gray-400 text-sm">Completed with {wrongCount} wrong guesses. 👍</div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-5xl font-black text-red-400 mb-1" style={{ textShadow: '0 0 30px rgba(239,68,68,0.5)' }}>
        COMPLETED!
      </div>
      <div className="text-gray-400 text-sm">You found them all after {wrongCount} wrong guesses. 🚉</div>
    </div>
  );
}

export default function ResultsModal({
  isOpen,
  startId,
  targetId,
  optimalPath,
  guessedIds,
  wrongGuesses,
  tripLines,
  onPlayAgain,
  onClose,
  mode,
}: ResultsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const totalStationsToGuess = optimalPath.length > 2 ? optimalPath.length - 2 : 0;
  const correctCount = guessedIds.length;
  const wrongCount = wrongGuesses.length;
  const gaveUp = correctCount < totalStationsToGuess;

  const accuracy = correctCount + wrongCount > 0 
    ? Math.round((correctCount / (correctCount + wrongCount)) * 100) 
    : 0;

  const score = totalStationsToGuess > 0 
    ? Math.round((correctCount / totalStationsToGuess) * 100) 
    : 100;

  const fakeAverage = React.useMemo(() => {
    let seed = 0;
    const combined = `${startId}-${targetId}-${new Date().getDate()}`;
    for (let i = 0; i < combined.length; i++) {
      seed += combined.charCodeAt(i);
    }
    const base = 72;
    const diff = (seed % 15) - (totalStationsToGuess % 4);
    return Math.max(55, Math.min(92, base + diff));
  }, [startId, targetId, totalStationsToGuess]);

  const handleCopyResult = () => {
    const start = STATION_MAP.get(startId)?.name ?? startId;
    const target = STATION_MAP.get(targetId)?.name ?? targetId;
    
    let resultText = 'COMPLETED';
    if (gaveUp) resultText = 'REVEALED';
    else if (wrongCount === 0) resultText = 'PERFECT';
    else if (wrongCount <= 2) resultText = 'EXCELLENT';
    else if (wrongCount <= 5) resultText = 'GREAT JOB';

    const text = [
      `🚇 Sydney MiniMetro Route Quiz`,
      `${start} ↔ ${target}`,
      `Result: ${resultText}`,
      `Score: ${score}% (Average: ${fakeAverage}%)`,
      `Correct: ${correctCount}/${totalStationsToGuess} stations`,
      `Wrong guesses: ${wrongCount}`,
      `Accuracy: ${accuracy}%`,
    ].join('\n');
    
    if (typeof window !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  if (!isOpen) return null;

  const startName = STATION_MAP.get(startId)?.name ?? startId;
  const targetName = STATION_MAP.get(targetId)?.name ?? targetId;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999 }}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="w-full max-w-xl glass-panel rounded-2xl overflow-hidden"
        style={{ animation: 'slideUp 0.4s ease-out forwards' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-game-border">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                {gaveUp ? '🏳 Trip Revealed' : wrongCount === 0 ? '🏆 Perfect Journey!' : '🚉 Journey Complete'}
              </h2>
              <p className="text-sm text-gray-500">
                <span className="text-white font-medium">{startName}</span>
                <span className="mx-2 text-gray-600">↔</span>
                <span className="text-white font-medium">{targetName}</span>
              </p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Score */}
        <div className="px-6 py-6 border-b border-game-border">
          <ScoreBadge 
            guessedCount={correctCount} 
            totalCount={totalStationsToGuess} 
            wrongCount={wrongCount} 
          />
        </div>

        {/* Score & Average Comparison */}
        <div className="px-6 py-4 bg-game-surface/20 border-b border-game-border flex items-center justify-around">
          <div className="text-center">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Your Score</div>
            <div className="text-3xl font-extrabold text-blue-400">{score}%</div>
          </div>
          <div className="h-8 w-px bg-game-border" />
          <div className="text-center">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Average Score Today</div>
            <div className="text-3xl font-extrabold text-gray-400">{fakeAverage}%</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-game-border border-b border-game-border">
          {[
            { label: 'Correct Guesses', value: `${correctCount}/${totalStationsToGuess}`, color: '#22c55e' },
            { label: 'Wrong Guesses', value: wrongCount, color: '#ef4444' },
            { label: 'Accuracy', value: `${accuracy}%`, color: '#60a5fa' },
          ].map(({ label, value, color }) => (
            <div key={label} className="px-4 py-3 text-center">
              <div className="text-2xl font-black" style={{ color }}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Route comparison / display */}
        <div className="px-6 py-5 border-b border-game-border max-h-56 overflow-y-auto custom-scroll">
          <PathDisplay 
            path={optimalPath} 
            guessedIds={guessedIds} 
            startId={startId} 
            targetId={targetId} 
            tripLines={tripLines}
          />
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3">
          <button
            onClick={handleCopyResult}
            className="flex-1 py-2.5 px-4 rounded-xl border border-game-border text-sm font-medium text-gray-300 hover:text-white hover:border-game-muted transition-all duration-200"
          >
            📋 Share Result
          </button>
          {mode === 'daily' ? (
            <button
              onClick={onPlayAgain}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all duration-200"
            >
              🎮 Practice Mode
            </button>
          ) : (
            <button
              onClick={onPlayAgain}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all duration-200"
            >
              🔄 New Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
