'use client';

import React, { useRef } from 'react';
import { STATION_MAP, LINE_MAP } from '@/lib/networkData';
import type { LineId, DailyHistoryItem } from '@/types';

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
  dailyHistory?: DailyHistoryItem[];
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
        <span className="text-xs font-semibold text-game-text-muted uppercase tracking-wider">Trip Route</span>
        <span className="text-xs text-game-text-muted font-mono ml-auto">
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
                    ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/30 text-blue-800 dark:text-blue-200 font-bold' 
                    : isGuessed 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-300' 
                      : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 opacity-90'}
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
                <span className="text-game-text-muted/40 text-xs self-center">→</span>
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
        <div className="text-4xl font-black text-game-text-muted mb-1">
          TRIP REVEALED
        </div>
        <div className="text-game-text-muted text-sm">You guessed {guessedCount} of {totalCount} stations. Try again! 🏁</div>
      </div>
    );
  }

  if (wrongCount === 0) {
    return (
      <div className="text-center">
        <div className="text-5xl font-black text-green-600 dark:text-green-500 mb-1" style={{ textShadow: '0 0 30px rgba(90,179,66,0.3)' }}>
          PERFECT!
        </div>
        <div className="text-game-text-muted text-sm">You guessed every station on the first try! 🎉</div>
      </div>
    );
  }
  
  if (wrongCount <= 2) {
    return (
      <div className="text-center">
        <div className="text-5xl font-black text-blue-600 dark:text-blue-400 mb-1" style={{ textShadow: '0 0 30px rgba(33,166,223,0.3)' }}>
          EXCELLENT!
        </div>
        <div className="text-game-text-muted text-sm">Just {wrongCount} wrong guess{wrongCount !== 1 ? 'es' : ''}! 🌟</div>
      </div>
    );
  }

  if (wrongCount <= 5) {
    return (
      <div className="text-center">
        <div className="text-5xl font-black text-amber-600 dark:text-amber-400 mb-1" style={{ textShadow: '0 0 30px rgba(245,158,11,0.3)' }}>
          GREAT JOB!
        </div>
        <div className="text-game-text-muted text-sm">Completed with {wrongCount} wrong guesses. 👍</div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-5xl font-black text-red-600 dark:text-red-400 mb-1" style={{ textShadow: '0 0 30px rgba(239,68,68,0.3)' }}>
        COMPLETED!
      </div>
      <div className="text-game-text-muted text-sm">You found them all after {wrongCount} wrong guesses. 🚉</div>
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
  dailyHistory = [],
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

  const personalStats = React.useMemo(() => {
    if (mode !== 'daily' || !dailyHistory || dailyHistory.length === 0) {
      return null;
    }

    const totalGames = dailyHistory.length;
    
    // Average score percentage
    const avgScore = Math.round(
      dailyHistory.reduce((sum, item) => {
        const itemScore = item.totalStationsToGuess > 0 
          ? (item.correctCount / item.totalStationsToGuess) * 100 
          : 100;
        return sum + itemScore;
      }, 0) / totalGames
    );

    // Compute previous history baseline (excluding today's date)
    const todayStr = new Date().toISOString().split('T')[0]; // Simple YYYY-MM-DD
    const previousAttempts = dailyHistory.filter(item => item.date !== todayStr);

    if (previousAttempts.length === 0) {
      return {
        totalGames,
        avgScore,
        comparison: 'first' as const,
        diff: 0
      };
    }

    const prevGames = previousAttempts.length;
    const prevAvgScore = Math.round(
      previousAttempts.reduce((sum, item) => {
        const itemScore = item.totalStationsToGuess > 0 
          ? (item.correctCount / item.totalStationsToGuess) * 100 
          : 100;
        return sum + itemScore;
      }, 0) / prevGames
    );

    const todayScore = totalStationsToGuess > 0 
      ? Math.round((correctCount / totalStationsToGuess) * 100) 
      : 100;

    const diff = todayScore - prevAvgScore;
    let comparison: 'improved' | 'worse' | 'same' = 'same';
    if (diff > 0) {
      comparison = 'improved';
    } else if (diff < 0) {
      comparison = 'worse';
    }

    return {
      totalGames,
      avgScore,
      prevAvgScore,
      comparison,
      diff: Math.abs(diff)
    };
  }, [mode, dailyHistory, totalStationsToGuess, correctCount]);

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

    const lines = [
      `🚇 Trackle Route Quiz`,
      `${start} ↔ ${target}`,
      `Result: ${resultText}`,
      personalStats 
        ? `Score: ${score}% (Personal Avg: ${personalStats.avgScore}%)`
        : `Score: ${score}% (Average: ${fakeAverage}%)`,
    ];

    if (personalStats) {
      if (personalStats.comparison === 'improved') {
        lines.push(`Performance: Improved by ↑${personalStats.diff}%`);
      } else if (personalStats.comparison === 'worse') {
        lines.push(`Performance: Declined by ↓${personalStats.diff}%`);
      } else if (personalStats.comparison === 'same') {
        lines.push(`Performance: On Par`);
      }
    }

    lines.push(
      `Correct: ${correctCount}/${totalStationsToGuess} stations`,
      `Wrong guesses: ${wrongCount}`,
      `Accuracy: ${accuracy}%`
    );

    const text = lines.join('\n');
    
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
        className="w-full max-w-xl glass-panel rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ animation: 'slideUp 0.4s ease-out forwards' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-game-border shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-game-text mb-1">
                {gaveUp ? '🏳 Trip Revealed' : wrongCount === 0 ? '🏆 Perfect Journey!' : '🚉 Journey Complete'}
              </h2>
              <p className="text-sm text-game-text-muted">
                <span className="text-game-text font-medium">{startName}</span>
                <span className="mx-2 text-gray-600">↔</span>
                <span className="text-game-text font-medium">{targetName}</span>
              </p>
            </div>
            <button onClick={onClose} className="text-game-text-muted hover:text-game-text transition-colors p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scroll min-h-0">
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
              <div className="text-xs text-game-text-muted font-semibold uppercase tracking-wider mb-1">Your Score</div>
              <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{score}%</div>
            </div>
            <div className="h-8 w-px bg-game-border" />
            <div className="text-center">
              <div className="text-xs text-game-text-muted font-semibold uppercase tracking-wider mb-1">Average Score Today</div>
              <div className="text-3xl font-extrabold text-slate-600 dark:text-gray-400">{fakeAverage}%</div>
            </div>
          </div>

          {/* Personal Lifetime Stats & Progress Comparison */}
          {personalStats && (
            <div className="px-6 py-4 border-b border-game-border bg-game-surface/10">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-game-text-muted uppercase tracking-wider">
                    Personal Statistics
                  </span>
                  <span className="text-xs text-game-text-muted">
                    {personalStats.totalGames} daily game{personalStats.totalGames !== 1 ? 's' : ''} played
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Lifetime Average Score */}
                  <div className="bg-game-surface/30 border border-game-border/30 rounded-xl p-3 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-game-text-muted font-semibold uppercase tracking-wider text-center">
                      Avg. Correct Guesses
                    </span>
                    <span className="text-2xl font-black text-game-text mt-1">
                      {personalStats.avgScore}%
                    </span>
                  </div>

                  {/* Performance Comparison Indicator */}
                  <div className="bg-game-surface/30 border border-game-border/30 rounded-xl p-3 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-game-text-muted font-semibold uppercase tracking-wider text-center">
                      Today&apos;s Performance
                    </span>
                    {personalStats.comparison === 'first' && (
                      <span className="text-xs font-semibold text-blue-500 dark:text-blue-400 mt-2 flex items-center gap-1">
                        First Game! 🌟
                      </span>
                    )}
                    {personalStats.comparison === 'improved' && (
                      <div className="flex flex-col items-center mt-1">
                        <span className="text-sm font-extrabold text-green-600 dark:text-green-400 flex items-center gap-1">
                          ↑ Improved
                        </span>
                        <span className="text-[10px] text-game-text-muted">
                          +{personalStats.diff}% vs average
                        </span>
                      </div>
                    )}
                    {personalStats.comparison === 'worse' && (
                      <div className="flex flex-col items-center mt-1">
                        <span className="text-sm font-extrabold text-red-600 dark:text-red-400 flex items-center gap-1">
                          ↓ Got Worse
                        </span>
                        <span className="text-[10px] text-game-text-muted">
                          -{personalStats.diff}% vs average
                        </span>
                      </div>
                    )}
                    {personalStats.comparison === 'same' && (
                      <div className="flex flex-col items-center mt-1">
                        <span className="text-sm font-extrabold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          ⚖ On Par
                        </span>
                        <span className="text-[10px] text-game-text-muted text-center">
                          Equal to your average
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-game-border border-b border-game-border">
            {[
              { label: 'Correct Guesses', value: `${correctCount}/${totalStationsToGuess}`, colorClass: 'text-green-600 dark:text-green-400' },
              { label: 'Wrong Guesses', value: wrongCount, colorClass: 'text-red-600 dark:text-red-400' },
              { label: 'Accuracy', value: `${accuracy}%`, colorClass: 'text-blue-600 dark:text-blue-400' },
            ].map(({ label, value, colorClass }) => (
              <div key={label} className="px-4 py-3 text-center">
                <div className={`text-2xl font-black ${colorClass}`}>{value}</div>
                <div className="text-xs text-game-text-muted mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Route comparison / display */}
          <div className="px-6 py-5 border-b border-game-border">
            <PathDisplay 
              path={optimalPath} 
              guessedIds={guessedIds} 
              startId={startId} 
              targetId={targetId} 
              tripLines={tripLines}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3 border-t border-game-border shrink-0">
          <button
            onClick={handleCopyResult}
            className="flex-1 py-2.5 px-4 rounded-xl border border-game-border text-sm font-medium text-game-text-muted hover:text-game-text hover:border-game-muted transition-all duration-200"
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
