'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import StationInput from '@/components/StationInput';
import GuessHistory from '@/components/GuessHistory';
import ResultsModal from '@/components/ResultsModal';
import HowToPlayModal from '@/components/HowToPlayModal';
import { STATION_MAP, LINE_MAP } from '@/lib/networkData';
import { findLinePath, getSharedLine, bfsShortestPathWithLines } from '@/lib/pathfinding';
import { getRandomChallenge, getDailyChallenge, getTodayString } from '@/lib/dailyChallenge';
import type { Station, GameState, LineId } from '@/types';

// Dynamically import map (SVG heavy, no SSR needed)
const GameMap = dynamic(() => import('@/components/GameMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-game-bg">
      <div className="text-gray-600 text-sm animate-pulse">Loading map…</div>
    </div>
  ),
});

function initGameState(
  startId: string,
  targetId: string,
  mode: 'daily' | 'practice',
  tripPath: string[],
  tripLines: LineId[]
): GameState {
  return {
    mode,
    startId,
    targetId,
    guessedIds: [],
    revealedEdgeKeys: new Set(),
    isComplete: false,
    optimalPath: tripPath,
    userPath: [],
    date: mode === 'daily' ? getTodayString() : undefined,
    tripPath,
    tripLines,
    wrongGuesses: [],
  };
}

type ToastMessage = {
  id: number;
  text: string;
  type: 'info' | 'success' | 'error';
};

export default function Home() {
  const [mode, setMode] = useState<'daily' | 'practice'>('daily');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = React.useRef(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Initialize theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const timer = setTimeout(() => {
      setTheme(initialTheme);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Check if user has seen tutorial on mount
  useEffect(() => {
    const hasSeenTutorial = document.cookie.split('; ').some(row => row.startsWith('trackle_tutorial_seen='));
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => {
        setShowHowToPlay(true);
      }, 0);
      document.cookie = 'trackle_tutorial_seen=true; max-age=31536000; path=/; SameSite=Lax';
      return () => clearTimeout(timer);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  const addToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(t => [...t, { id, text, type }]);
    setTimeout(() => setToasts(t => t.filter(m => m.id !== id)), 3000);
  }, []);

  const stationsList = React.useMemo(() => {
    return Array.from(STATION_MAP.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Start a new game
  const startGame = useCallback((m: 'daily' | 'practice', customStartId?: string, customTargetId?: string) => {
    let startId: string, targetId: string;
    if (m === 'daily') {
      const c = getDailyChallenge(getTodayString());
      startId = c.start;
      targetId = c.target;
    } else {
      if (customStartId && customTargetId) {
        startId = customStartId;
        targetId = customTargetId;
      } else {
        const c = getRandomChallenge();
        startId = c.start;
        targetId = c.target;
      }
    }

    if (startId === targetId) {
      addToast("Start and end stations must be different!", "error");
      return;
    }

    const line = getSharedLine(startId, targetId);
    let tripPath: string[] = [];
    let tripLines: LineId[] = [];

    if (line) {
      tripPath = findLinePath(startId, targetId, line) ?? [];
      tripLines = [line];
    } else {
      const pathWithLines = bfsShortestPathWithLines(startId, targetId);
      if (pathWithLines) {
        tripPath = pathWithLines.path;
        tripLines = pathWithLines.lines;
      }
    }

    if (tripPath.length === 0) {
      addToast("No valid rail path found between these stations!", "error");
      return;
    }

    setMode(m);
    setGameState(initGameState(startId, targetId, m, tripPath, tripLines));
    setShowResults(false);
  }, [addToast]);

  const handlePracticeChange = useCallback((newStartId: string, newTargetId: string) => {
    startGame('practice', newStartId, newTargetId);
  }, [startGame]);

  // Initialize on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startGame('daily');
    }, 0);
    return () => clearTimeout(timer);
  }, [startGame]);

  // Handle a player guess
  const handleGuess = useCallback((station: Station) => {
    if (!gameState || gameState.isComplete) return;

    const { guessedIds, wrongGuesses, tripPath, tripLines } = gameState;

    // Already guessed?
    if (guessedIds.includes(station.id) || wrongGuesses.includes(station.id)) {
      addToast(`${station.name} already guessed`, 'error');
      return;
    }

    const intermediateStations = tripPath.slice(1, -1);
    const isCorrect = intermediateStations.includes(station.id);

    if (isCorrect) {
      const newGuessedIds = [...guessedIds, station.id];
      const allGuessed = intermediateStations.every(id => newGuessedIds.includes(id));

      const newState: GameState = {
        ...gameState,
        guessedIds: newGuessedIds,
        isComplete: allGuessed,
        userPath: allGuessed ? tripPath : [],
      };

      setGameState(newState);

      if (allGuessed) {
        setTimeout(() => setShowResults(true), 800);
        addToast(`🎉 Connected! You guessed all stations on the trip!`, 'success');
      } else {
        addToast(`Correct! Added ${station.name}`, 'success');
      }
    } else {
      const newWrongGuesses = [...wrongGuesses, station.id];
      const hasLineOverlap = station.lines.some(l => tripLines.includes(l));

      const newState: GameState = {
        ...gameState,
        wrongGuesses: newWrongGuesses,
      };

      setGameState(newState);

      if (!hasLineOverlap) {
        addToast(`${station.name} is not on the correct lines!`, 'error');
      } else {
        addToast(`${station.name} is not on this trip!`, 'error');
      }
    }
  }, [gameState, addToast]);

  const handleGiveUp = useCallback(() => {
    if (!gameState || gameState.isComplete) return;
    const newState: GameState = {
      ...gameState,
      isComplete: true,
      userPath: gameState.tripPath,
    };
    setGameState(newState);
    setTimeout(() => setShowResults(true), 400);
  }, [gameState]);

  const handlePlayAgain = useCallback(() => {
    startGame('practice');
  }, [startGame]);

  if (!gameState) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-game-bg">
        <div className="text-gray-500 animate-pulse text-sm">Loading challenge…</div>
      </div>
    );
  }

  const startStation = STATION_MAP.get(gameState.startId);
  const targetStation = STATION_MAP.get(gameState.targetId);

  return (
    <main className="w-screen h-screen flex flex-col overflow-hidden" id="main-game">
      {/* ── TOP NAV ───────────────────────────────────────────────── */}
      <nav className="glass-panel border-b border-game-border z-20 flex items-center justify-between px-4 py-2 shrink-0" id="nav-bar">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/trackle_logo.png" alt="Trackle Logo" className="w-7 h-7 object-contain" />
            <span className="text-game-text font-bold text-sm hidden sm:block">Trackle</span>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 bg-game-surface rounded-lg p-0.5 ml-2">
            {(['daily', 'practice'] as const).map(m => (
              <button
                key={m}
                id={`mode-${m}`}
                onClick={() => startGame(m)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200 capitalize ${
                  mode === m
                    ? m === 'daily'
                      ? 'bg-orange-500 text-white'
                      : 'bg-blue-500 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {m === 'daily' ? '📅 Daily' : '🎮 Practice'}
              </button>
            ))}
          </div>
        </div>

        {/* Challenge header */}
        <div className="flex items-center gap-2 text-sm">
          {mode === 'practice' ? (
            <div className="flex items-center gap-2">
              <select
                value={gameState.startId}
                onChange={(e) => handlePracticeChange(e.target.value, gameState.targetId)}
                className="bg-game-surface border border-game-border text-game-text text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold cursor-pointer hover:bg-game-surface/80 transition-colors"
              >
                {stationsList.map(s => (
                  <option key={s.id} value={s.id} className="bg-game-bg text-game-text">
                    {s.name}
                  </option>
                ))}
              </select>
              <span className="text-gray-500 font-semibold">↔</span>
              <select
                value={gameState.targetId}
                onChange={(e) => handlePracticeChange(gameState.startId, e.target.value)}
                className="bg-game-surface border border-game-border text-game-text text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold cursor-pointer hover:bg-game-surface/80 transition-colors"
              >
                {stationsList.map(s => (
                  <option key={s.id} value={s.id} className="bg-game-bg text-game-text">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              {startStation && (
                <div className="flex items-center gap-2">
                  <span className="text-game-text font-semibold">{startStation.name}</span>
                </div>
              )}
              <span className="text-gray-500 font-semibold">↔</span>
              {targetStation && (
                <div className="flex items-center gap-2">
                  <span className="text-game-text font-semibold">{targetStation.name}</span>
                </div>
              )}
            </>
          )}
          {gameState.tripLines && (
            <div className="hidden sm:flex items-center gap-1.5 ml-4 border-l border-game-border pl-4">
              <span className="text-gray-500 text-xs">Use lines:</span>
              {gameState.tripLines.map(lineId => {
                const line = LINE_MAP[lineId];
                return (
                  <span
                    key={lineId}
                    className="line-badge text-xs font-semibold"
                    style={{ backgroundColor: line?.color, color: line?.textColor }}
                  >
                    {lineId}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Guess count */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-game-border hover:bg-game-surface text-game-text-muted hover:text-game-text transition-colors flex items-center justify-center"
            aria-label="Toggle Theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setShowHowToPlay(true)}
            className="p-1.5 rounded-lg border border-game-border hover:bg-game-surface text-game-text-muted hover:text-game-text transition-colors flex items-center justify-center"
            aria-label="How to Play"
            title="How to Play"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
          </button>
          <span className="text-game-text-muted text-xs font-mono">
            {gameState.guessedIds.length} correct / {gameState.tripPath.length > 2 ? gameState.tripPath.length - 2 : 0} stations
          </span>
          {gameState.isComplete && (
            <button
              id="btn-show-results"
              onClick={() => setShowResults(true)}
              className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-semibold text-white transition-colors"
            >
              Results
            </button>
          )}
        </div>
      </nav>

      {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* MAP AREA */}
        <div className="flex-1 relative min-w-0">
          <GameMap
            startId={gameState.startId}
            targetId={gameState.targetId}
            guessedIds={gameState.guessedIds}
            optimalPath={gameState.isComplete ? gameState.optimalPath : undefined}
            isComplete={gameState.isComplete}
            wrongGuesses={gameState.wrongGuesses}
            tripLines={gameState.tripLines}
          />
        </div>

        {/* SIDE PANEL */}
        <aside className="w-72 shrink-0 glass-panel border-l border-game-border flex flex-col overflow-hidden z-10" id="side-panel">
          {/* Challenge info */}
          <div className="px-4 pt-4 pb-3 border-b border-game-border">
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
              {mode === 'daily' ? `Daily Challenge · ${getTodayString()}` : 'Practice Mode'}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-16">Endpoint</span>
                <span className="text-game-text font-semibold text-sm">{startStation?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-16">Endpoint</span>
                <span className="text-game-text font-semibold text-sm">{targetStation?.name}</span>
              </div>
              {gameState.tripLines && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-gray-500 w-16">Lines</span>
                  <div className="flex flex-wrap gap-1">
                    {gameState.tripLines.map(lineId => {
                      const line = LINE_MAP[lineId];
                      return (
                        <span
                          key={lineId}
                          className="line-badge text-xs font-semibold"
                          style={{ backgroundColor: line?.color, color: line?.textColor }}
                        >
                          {lineId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          {!gameState.isComplete && (
            <div className="px-3 py-3 border-b border-game-border flex flex-col gap-2">
              <StationInput
                onGuess={handleGuess}
                guessedIds={new Set([...gameState.guessedIds, ...gameState.wrongGuesses, gameState.startId, gameState.targetId])}
                startId={gameState.startId}
                targetId={gameState.targetId}
                disabled={gameState.isComplete}
              />
              <button
                onClick={handleGiveUp}
                className="w-full py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/30 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 transition-colors"
              >
                🏳 Give Up / Reveal Route
              </button>
            </div>
          )}

          {/* Guess history */}
          <div className="flex-1 px-3 py-3 overflow-hidden min-h-0">
            <GuessHistory
              guessedIds={gameState.guessedIds}
              startId={gameState.startId}
              targetId={gameState.targetId}
              userPath={gameState.userPath ?? null}
              isComplete={gameState.isComplete}
              wrongGuesses={gameState.wrongGuesses}
              tripPath={gameState.tripPath}
              tripLines={gameState.tripLines}
            />
          </div>

          {/* How to play footer */}
          <div className="px-3 pb-3 pt-2 border-t border-game-border">
            <p className="text-xs text-gray-600 leading-relaxed">
              Guess all the intermediate stations along the trip between the two endpoints.
              Pre-stated lines show which routes are part of this journey.
            </p>
          </div>
        </aside>
      </div>

      {/* ── TOAST NOTIFICATIONS ───────────────────────────────────── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 pointer-events-none" style={{ zIndex: 10000 }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium shadow-lg
              ${toast.type === 'success' ? 'bg-green-900/90 text-green-200 border border-green-700' : ''}
              ${toast.type === 'error' ? 'bg-red-900/90 text-red-200 border border-red-700' : ''}
              ${toast.type === 'info' ? 'bg-game-panel/90 text-gray-300 border border-game-border' : ''}
            `}
            style={{ animation: 'fadeInUp 0.3s ease-out forwards' }}
          >
            {toast.text}
          </div>
        ))}
      </div>

      {/* ── RESULTS MODAL ─────────────────────────────────────────── */}
      {gameState.isComplete && (
        <ResultsModal
          isOpen={showResults}
          startId={gameState.startId}
          targetId={gameState.targetId}
          optimalPath={gameState.optimalPath}
          userPath={gameState.userPath ?? null}
          guessedIds={gameState.guessedIds}
          wrongGuesses={gameState.wrongGuesses}
          tripLines={gameState.tripLines}
          onPlayAgain={handlePlayAgain}
          onClose={() => setShowResults(false)}
          mode={mode}
        />
      )}

      {/* ── HOW TO PLAY TUTORIAL ──────────────────────────────────── */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </main>
  );
}
