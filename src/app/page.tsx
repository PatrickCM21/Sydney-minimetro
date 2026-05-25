'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import StationInput from '@/components/StationInput';
import GuessHistory from '@/components/GuessHistory';
import ResultsModal from '@/components/ResultsModal';
import { STATION_MAP, LINE_MAP } from '@/lib/networkData';
import { bfsShortestPath, extractUserPath, areAdjacent } from '@/lib/pathfinding';
import { getRandomChallenge, getDailyChallenge, getTodayString } from '@/lib/dailyChallenge';
import type { Station, GameState } from '@/types';

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
  mode: 'daily' | 'practice'
): GameState {
  return {
    mode,
    startId,
    targetId,
    guessedIds: [],
    revealedEdgeKeys: new Set(),
    isComplete: false,
    optimalPath: [],
    userPath: [],
    date: mode === 'daily' ? getTodayString() : undefined,
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
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = React.useRef(0);

  const addToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(t => [...t, { id, text, type }]);
    setTimeout(() => setToasts(t => t.filter(m => m.id !== id)), 3000);
  }, []);

  // Start a new game
  const startGame = useCallback((m: 'daily' | 'practice') => {
    let startId: string, targetId: string;
    if (m === 'daily') {
      const c = getDailyChallenge(getTodayString());
      startId = c.start;
      targetId = c.target;
    } else {
      const c = getRandomChallenge();
      startId = c.start;
      targetId = c.target;
    }
    setMode(m);
    setGameState(initGameState(startId, targetId, m));
    setShowResults(false);
  }, []);

  // Initialize on mount
  useEffect(() => {
    startGame('daily');
  }, [startGame]);

  // Handle a player guess
  const handleGuess = useCallback((station: Station) => {
    if (!gameState || gameState.isComplete) return;

    const { startId, targetId, guessedIds } = gameState;

    // Already guessed?
    if (guessedIds.includes(station.id)) {
      addToast(`${station.name} already guessed`, 'error');
      return;
    }

    const newGuessedIds = [...guessedIds, station.id];

    // Check if this guess creates a connection between the start and target
    // (BFS through all active nodes: start + guessed + target)
    const activeNodes = new Set([startId, targetId, ...newGuessedIds]);
    const userPath = extractUserPath(newGuessedIds, startId, targetId);

    if (station.id === targetId) {
      // Shouldn't happen (target is excluded from autocomplete) but guard anyway
      return;
    }

    // Was this station adjacent to nothing? Warn but allow
    const allActiveExceptNew = new Set([startId, targetId, ...guessedIds]);
    const hasNeighbor = (STATION_MAP.get(station.id)?.lines ?? []).length > 0;

    const newState: GameState = {
      ...gameState,
      guessedIds: newGuessedIds,
      revealedEdgeKeys: new Set(), // recomputed by GameMap
    };

    // If a valid path now exists, end the game
    if (userPath) {
      const optimalPath = bfsShortestPath(startId, targetId) ?? [];
      newState.isComplete = true;
      newState.optimalPath = optimalPath;
      newState.userPath = userPath;
      setGameState(newState);
      setTimeout(() => setShowResults(true), 800);
      addToast(`🎉 Connected! Path found in ${newGuessedIds.length} guess${newGuessedIds.length !== 1 ? 'es' : ''}`, 'success');
    } else {
      setGameState(newState);
      addToast(`Added ${station.name}`, 'info');
    }
  }, [gameState, addToast]);

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
  const startLine = startStation ? LINE_MAP[startStation.lines[0]] : null;
  const targetLine = targetStation ? LINE_MAP[targetStation.lines[0]] : null;

  return (
    <main className="w-screen h-screen flex flex-col overflow-hidden" id="main-game">
      {/* ── TOP NAV ───────────────────────────────────────────────── */}
      <nav className="glass-panel border-b border-game-border z-20 flex items-center justify-between px-4 py-2 shrink-0" id="nav-bar">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <span className="text-white text-xs font-black">M</span>
            </div>
            <span className="text-white font-bold text-sm hidden sm:block">Sydney MiniMetro</span>
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
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {m === 'daily' ? '📅 Daily' : '🎮 Practice'}
              </button>
            ))}
          </div>
        </div>

        {/* Challenge header */}
        <div className="flex items-center gap-3 text-sm">
          {startStation && (
            <div className="hidden md:flex items-center gap-2">
              <span
                className="line-badge"
                style={{ backgroundColor: startLine?.color, color: startLine?.textColor }}
              >
                {startStation.lines[0]}
              </span>
              <span className="text-green-400 font-semibold">{startStation.name}</span>
            </div>
          )}
          <span className="text-gray-600">→</span>
          {targetStation && (
            <div className="hidden md:flex items-center gap-2">
              <span
                className="line-badge"
                style={{ backgroundColor: targetLine?.color, color: targetLine?.textColor }}
              >
                {targetStation.lines[0]}
              </span>
              <span className="text-red-400 font-semibold">{targetStation.name}</span>
            </div>
          )}
        </div>

        {/* Guess count */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs font-mono">
            {gameState.guessedIds.length} guess{gameState.guessedIds.length !== 1 ? 'es' : ''}
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
            userPath={gameState.isComplete ? (gameState.userPath ?? undefined) : undefined}
            isComplete={gameState.isComplete}
          />
        </div>

        {/* SIDE PANEL */}
        <aside className="w-72 shrink-0 glass-panel border-l border-game-border flex flex-col overflow-hidden z-10" id="side-panel">
          {/* Challenge info */}
          <div className="px-4 pt-4 pb-3 border-b border-game-border">
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
              {mode === 'daily' ? `Daily Challenge · ${getTodayString()}` : 'Practice Mode'}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-12">From</span>
                <span
                  className="line-badge text-xs"
                  style={{ backgroundColor: startLine?.color, color: startLine?.textColor }}
                >
                  {startStation?.lines[0]}
                </span>
                <span className="text-green-400 font-semibold text-sm">{startStation?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-12">To</span>
                <span
                  className="line-badge text-xs"
                  style={{ backgroundColor: targetLine?.color, color: targetLine?.textColor }}
                >
                  {targetStation?.lines[0]}
                </span>
                <span className="text-red-400 font-semibold text-sm">{targetStation?.name}</span>
              </div>
            </div>
            {/* Optimal stops hint (visible only after game ends) */}
            {gameState.isComplete && gameState.optimalPath.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                Optimal: <span className="text-green-400 font-semibold">{gameState.optimalPath.length - 1} stops</span>
              </div>
            )}
          </div>

          {/* Input */}
          {!gameState.isComplete && (
            <div className="px-3 py-3 border-b border-game-border">
              <StationInput
                onGuess={handleGuess}
                guessedIds={new Set([...gameState.guessedIds, gameState.startId, gameState.targetId])}
                startId={gameState.startId}
                targetId={gameState.targetId}
                disabled={gameState.isComplete}
              />
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
            />
          </div>

          {/* How to play footer */}
          <div className="px-3 pb-3 pt-2 border-t border-game-border">
            <p className="text-xs text-gray-600 leading-relaxed">
              Name intermediate stations to build a connected path between{' '}
              <span className="text-green-400">{startStation?.name}</span> and{' '}
              <span className="text-red-400">{targetStation?.name}</span>.
              Adjacent stations will light up on the map.
            </p>
          </div>
        </aside>
      </div>

      {/* ── TOAST NOTIFICATIONS ───────────────────────────────────── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 pointer-events-none">
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
          onPlayAgain={handlePlayAgain}
          onClose={() => setShowResults(false)}
          mode={mode}
        />
      )}
    </main>
  );
}
