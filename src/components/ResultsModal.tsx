'use client';

import React, { useRef } from 'react';
import { STATION_MAP, LINE_MAP } from '@/lib/networkData';
import { getStationLinesOnPath } from '@/lib/pathfinding';
import type { LineId, DailyHistoryItem } from '@/types';
import ShareButton from '@/components/ShareButton';

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
  date?: string;
  addToast?: (text: string, type?: 'info' | 'success' | 'error') => void;
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

  const stationLinesMap = React.useMemo(() => {
    return getStationLinesOnPath(path, tripLines || []);
  }, [path, tripLines]);

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
          const activeLine = stationLinesMap[id] || station.lines.find(l => tripLines.includes(l)) || station.lines[0];
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
  if (!gaveUp) {
    let winTitle = "YOU WON!";
    let winSubtitle = `You successfully connected the route by guessing all ${totalCount} stations!`;
    if (wrongCount === 0) {
      winTitle = "PERFECT WIN!";
      winSubtitle = "You guessed every station on the first try!";
    } else if (wrongCount <= 2) {
      winTitle = "EXCELLENT WIN!";
      winSubtitle = `Connected all stations with only ${wrongCount} wrong guesses!`;
    }

    return (
      <div className="text-center">
        <div className="text-3xl sm:text-4xl md:text-5xl font-black text-green-600 dark:text-green-500 mb-1" style={{ textShadow: '0 0 30px rgba(90,179,66,0.3)' }}>
          {winTitle}
        </div>
        <div className="text-game-text-muted text-sm">{winSubtitle}</div>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      <div className="text-3xl font-black tracking-tight text-game-text sm:text-4xl">
        You got{" "}
        <span className="text-orange-500 decoration-4 decoration-orange-200 underline-offset-4">
          {guessedCount}
        </span>{" "}
        / {totalCount} stations!
      </div>
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
  date,
  addToast,
}: ResultsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = React.useState('');
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const totalStationsToGuess = optimalPath.length > 2 ? optimalPath.length - 2 : 0;
  const correctCount = guessedIds.length;
  const wrongCount = wrongGuesses.length;
  const gaveUp = correctCount < totalStationsToGuess;

  const score = totalStationsToGuess > 0
    ? Math.round((correctCount / totalStationsToGuess) * 100)
    : 100;

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const startStation = STATION_MAP.get(startId)?.name ?? startId;
      const targetStation = STATION_MAP.get(targetId)?.name ?? targetId;

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback,
          score,
          mode,
          startStation,
          targetStation,
          guessedCount: correctCount,
          totalCount: totalStationsToGuess,
          wrongCount,
        }),
      });

      if (res.ok) {
        addToast?.('Feedback sent successfully!', 'success');
        setFeedback('');
        setShowFeedback(false);
      } else {
        setSubmitStatus('error');
      }
    } catch (err) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const [globalAvgScore, setGlobalAvgScore] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (isOpen && mode === 'daily' && date) {
      fetch(`/api/stats?date=${date}`)
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.avg_score === 'number' && data.total_submissions > 0) {
            setGlobalAvgScore(Math.round(data.avg_score));
          }
        })
        .catch(err => console.error("Error fetching stats:", err));
    }
  }, [isOpen, mode, date]);

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
                {gaveUp ? 'Trip Revealed' : wrongCount === 0 ? 'Perfect Journey!' : 'Journey Complete'}
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
            <div className="text-center flex-1">
              <div className="text-xs text-game-text-muted font-semibold uppercase tracking-wider mb-1">Your Score</div>
              <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{score}%</div>
            </div>
            {mode === 'daily' && (
              <>
                <div className="h-8 w-px bg-game-border" />
                <div className="text-center flex-1">
                  <div className="text-xs text-game-text-muted font-semibold uppercase tracking-wider mb-1">Average Score Today</div>
                  <div className="text-3xl font-extrabold text-slate-600 dark:text-gray-400">
                    {globalAvgScore !== null ? `${globalAvgScore}%` : `${fakeAverage}%`}
                  </div>
                </div>
              </>
            )}
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
                        First Game!
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
          <div className="grid grid-cols-2 divide-x divide-game-border border-b border-game-border">
            {[
              { label: 'Correct Guesses', value: `${correctCount}/${totalStationsToGuess}`, colorClass: 'text-green-600 dark:text-green-400' },
              { label: 'Wrong Guesses', value: wrongCount, colorClass: 'text-red-600 dark:text-red-400' },
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
        <div className="px-6 py-4 flex flex-col gap-3 border-t border-game-border shrink-0">
          {showFeedback && (
            <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-2 bg-game-surface/30 p-3 rounded-xl border border-game-border/30">
              <div className="text-xs font-semibold text-game-text-muted">Give Feedback</div>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Spotted an issue? Have a suggestion?"
                rows={2}
                required
                className="w-full text-xs p-2 bg-game-bg border border-game-border rounded-lg text-game-text focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowFeedback(false)}
                  className="px-2.5 py-1 text-xs text-game-text-muted hover:text-game-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Submit'}
                </button>
              </div>
              {submitStatus === 'success' && <div className="text-[10px] text-green-500 text-right">Feedback sent successfully!</div>}
              {submitStatus === 'error' && <div className="text-[10px] text-red-500 text-right">Failed to send feedback.</div>}
            </form>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <ShareButton
                startId={startId}
                targetId={targetId}
                optimalPath={optimalPath}
                guessedIds={guessedIds}
                wrongGuesses={wrongGuesses}
                tripLines={tripLines}
                score={score}
                personalStats={personalStats}
              />
              {mode === 'daily' ? (
                <button
                  onClick={onPlayAgain}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 border border-game-border text-sm font-medium text-game-text hover:text-game-text hover:border-game-muted transition-all duration-200"
                >
                  Practice Mode
                </button>
              ) : (
                <button
                  onClick={onPlayAgain}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-game-border text-sm font-medium text-game-text-muted hover:text-game-text hover:border-game-muted transition-all duration-200"
                >
                  New Game
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setShowFeedback(!showFeedback);
                setSubmitStatus('idle');
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-game-border text-xs font-semibold text-game-text-muted hover:text-game-text hover:border-game-muted transition-all duration-200"
            >
              {showFeedback ? 'Hide Feedback Form' : 'Give Feedback / Report a Bug'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
