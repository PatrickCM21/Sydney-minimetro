'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import StationInput from '@/components/StationInput';
import GuessHistory from '@/components/GuessHistory';
import ResultsModal from '@/components/ResultsModal';
import HowToPlayModal from '@/components/HowToPlayModal';
import SettingsModal from '@/components/SettingsModal';
import { STATION_MAP, LINE_MAP } from '@/lib/networkData';
import { findLinePath, getSharedLine, bfsShortestPathWithLines } from '@/lib/pathfinding';
import { getRandomChallenge, getDailyChallenge, getTodayString } from '@/lib/dailyChallenge';
import type { Station, GameState, LineId, DailyHistoryItem } from '@/types';

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
  const [darkMap, setDarkMap] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [dailyHistory, setDailyHistory] = useState<DailyHistoryItem[]>([]);
  const [hardMode, setHardMode] = useState<boolean>(false);
  const [showMobileTimeline, setShowMobileTimeline] = useState<boolean>(false);

  // Load daily game history on mount
  useEffect(() => {
    const historyJson = localStorage.getItem('trackle_daily_history');
    if (historyJson) {
      try {
        const parsed = JSON.parse(historyJson);
        if (Array.isArray(parsed)) {
          const timer = setTimeout(() => {
            setDailyHistory(parsed);
          }, 0);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        console.error("Failed to parse daily history", e);
      }
    }
  }, []);

  const saveDailyProgress = useCallback((guessedIds: string[], wrongGuesses: string[], isComplete: boolean) => {
    const progress = {
      date: getTodayString(),
      guessedIds,
      wrongGuesses,
      isComplete,
    };
    localStorage.setItem('trackle_daily_state', JSON.stringify(progress));
  }, []);

  const saveToDailyHistory = useCallback((state: GameState) => {
    if (state.mode !== 'daily' || !state.date || !state.isComplete) return;

    const totalStationsToGuess = state.tripPath.length > 2 ? state.tripPath.length - 2 : 0;
    const correctCount = state.guessedIds.length;
    const wrongCount = state.wrongGuesses.length;
    const gaveUp = correctCount < totalStationsToGuess;

    const score = totalStationsToGuess > 0
      ? Math.round((correctCount / totalStationsToGuess) * 100)
      : 100;

    // Send statistics atomically to the database
    fetch('/api/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: state.date,
        guesses: correctCount,
        score
      })
    }).catch(err => {
      console.error('Error submitting stats:', err);
    });

    setDailyHistory(prevHistory => {
      const alreadyExists = prevHistory.some(item => item.date === state.date);
      if (alreadyExists) return prevHistory;

      const historyItem: DailyHistoryItem = {
        date: state.date!,
        startId: state.startId,
        targetId: state.targetId,
        correctCount,
        wrongCount,
        totalStationsToGuess,
        gaveUp,
      };

      const nextHistory = [...prevHistory, historyItem];
      localStorage.setItem('trackle_daily_history', JSON.stringify(nextHistory));
      return nextHistory;
    });
  }, []);

  // Initialize theme and settings on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const savedHardMode = localStorage.getItem('trackle_hard_mode') === 'true';
    const savedDarkMap = localStorage.getItem('trackle_dark_map') === 'true';
    const timer = setTimeout(() => {
      setTheme(initialTheme);
      setHardMode(savedHardMode);
      setDarkMap(savedDarkMap);
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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

  const addToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(t => [...t, { id, text, type }]);
    setTimeout(() => setToasts(t => t.filter(m => m.id !== id)), 3000);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    addToast(nextTheme === 'dark' ? "Dark theme activated!" : "Light theme activated!", "info");
  }, [theme, addToast]);

  const toggleHardMode = useCallback(() => {
    setHardMode(prev => {
      const next = !prev;
      localStorage.setItem('trackle_hard_mode', String(next));
      return next;
    });
    addToast(!hardMode ? "Hard mode activated! Only adjacent revealed segments will show." : "Normal mode activated! Entire route tracks will show.", "info");
  }, [hardMode, addToast]);

  const toggleDarkMap = useCallback(() => {
    setDarkMap(prev => {
      const next = !prev;
      localStorage.setItem('trackle_dark_map', String(next));
      return next;
    });
    addToast(!darkMap ? "Dark map style enabled!" : "Light map style enabled!", "info");
  }, [darkMap, addToast]);

  const stationsList = React.useMemo(() => {
    return Array.from(STATION_MAP.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Start a new game
  const startGame = useCallback(async (m: 'daily' | 'practice', customStartId?: string, customTargetId?: string) => {
    let startId: string, targetId: string;
    let challengeDate: string | undefined;

    if (m === 'daily') {
      let challenge: { start: string; target: string; date: string } | null = null;
      const cached = localStorage.getItem('trackle_daily_challenge_cached');
      const lastCheck = localStorage.getItem('trackle_last_challenge_check');
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;
      let needsFetch = !cached || !lastCheck || (now - Number(lastCheck)) > ONE_HOUR;

      if (!needsFetch && cached) {
        try {
          challenge = JSON.parse(cached);
        } catch (e) {
          needsFetch = true;
        }
      }

      if (needsFetch) {
        try {
          const res = await fetch('/api/daily');
          if (res.ok) {
            challenge = await res.json();
            if (challenge) {
              localStorage.setItem('trackle_daily_challenge_cached', JSON.stringify(challenge));
              localStorage.setItem('trackle_last_challenge_check', String(now));
            }
          }
        } catch (e) {
          console.error("Failed to fetch daily challenge", e);
        }
      }

      if (!challenge) {
        challenge = getDailyChallenge(getTodayString());
      }

      startId = challenge.start;
      targetId = challenge.target;
      challengeDate = challenge.date;
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
    const state = initGameState(startId, targetId, m, tripPath, tripLines);
    if (challengeDate) {
      state.date = challengeDate;
    }
    let isRestoredComplete = false;

    if (m === 'daily') {
      const saved = localStorage.getItem('trackle_daily_state');
      const targetDate = challengeDate || getTodayString();
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.date === targetDate) {
            state.guessedIds = parsed.guessedIds || [];
            state.wrongGuesses = parsed.wrongGuesses || [];
            state.isComplete = parsed.isComplete || false;
            if (state.isComplete) {
              state.userPath = tripPath;
              isRestoredComplete = true;
            }
          } else {
            // Clear progress for a new day
            localStorage.removeItem('trackle_daily_state');
          }
        } catch (e) {
          console.error("Failed to parse daily state", e);
        }
      }
    }

    setGameState(state);
    if (isRestoredComplete) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
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

      if (gameState.mode === 'daily') {
        saveDailyProgress(newGuessedIds, wrongGuesses, allGuessed);
        if (allGuessed) {
          saveToDailyHistory(newState);
        }
      }

      if (allGuessed) {
        setTimeout(() => setShowResults(true), 800);
        addToast(`Connected! You guessed all stations on the trip!`, 'success');
      } else {
        addToast(`Correct! Added ${station.name}`, 'success');
      }
    } else {
      const newWrongGuesses = [...wrongGuesses, station.id];
      const hasLineOverlap = station.lines.some(l => tripLines.includes(l));
      const isFailed = newWrongGuesses.length >= 5;

      const newState: GameState = {
        ...gameState,
        wrongGuesses: newWrongGuesses,
        isComplete: isFailed ? true : gameState.isComplete,
        userPath: isFailed ? tripPath : gameState.userPath,
      };

      setGameState(newState);

      if (gameState.mode === 'daily') {
        saveDailyProgress(guessedIds, newWrongGuesses, isFailed);
        if (isFailed) {
          saveToDailyHistory(newState);
        }
      }

      if (isFailed) {
        setTimeout(() => setShowResults(true), 800);
        addToast(`Game Over! 5 wrong guesses reached. The route has been revealed.`, 'error');
      } else if (!hasLineOverlap) {
        addToast(`${station.name} is not on the correct lines!`, 'error');
      } else {
        addToast(`${station.name} is not on this trip!`, 'error');
      }
    }
  }, [gameState, addToast, saveDailyProgress, saveToDailyHistory]);

  const handleGiveUp = useCallback(() => {
    if (!gameState || gameState.isComplete) return;
    const newState: GameState = {
      ...gameState,
      isComplete: true,
      userPath: gameState.tripPath,
    };
    setGameState(newState);

    if (gameState.mode === 'daily') {
      saveDailyProgress(gameState.guessedIds, gameState.wrongGuesses, true);
      saveToDailyHistory(newState);
    }

    setTimeout(() => setShowResults(true), 400);
  }, [gameState, saveDailyProgress, saveToDailyHistory]);

  const handlePlayAgain = useCallback(() => {
    startGame('practice');
  }, [startGame]);

  if (!gameState) {
    return (
      <div className="w-full h-dvh flex items-center justify-center bg-game-bg">
        <div className="text-gray-500 animate-pulse text-sm">Loading challenge…</div>
      </div>
    );
  }

  const startStation = STATION_MAP.get(gameState.startId);
  const targetStation = STATION_MAP.get(gameState.targetId);

  return (
    <main className="w-full h-dvh flex flex-col overflow-hidden" id="main-game">
      {/* ── TOP NAV ───────────────────────────────────────────────── */}
      <nav className="relative glass-panel border-b border-game-border z-[2000] flex items-center justify-between px-4 py-2 shrink-0" id="nav-bar">
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
                className={`px-4 py-2 md:px-3 md:py-1 rounded-md text-xs font-semibold transition-all duration-200 capitalize ${mode === m
                  ? m === 'daily'
                    ? 'bg-orange-500 text-white'
                    : 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {m === 'daily' ? 'Daily' : 'Practice'}
              </button>
            ))}
          </div>
        </div>

        {/* Challenge header */}
        <div className="hidden md:flex items-center gap-2 text-sm">
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

        {/* Guess count and Settings */}
        <div className="flex items-center gap-2">
          {/* Help Button */}
          <button
            onClick={() => setShowHowToPlay(true)}
            className="p-2.5 md:p-1.5 rounded-lg border border-game-border hover:bg-game-surface text-game-text-muted hover:text-game-text transition-colors flex items-center justify-center"
            aria-label="How to Play"
            title="How to Play"
          >
            <svg className="w-5 h-5 md:w-[14px] md:h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 md:p-1.5 rounded-lg border border-game-border hover:bg-game-surface text-game-text-muted hover:text-game-text transition-colors flex items-center justify-center"
            aria-label="Settings"
            title="Settings"
          >
            <svg className="w-5 h-5 md:w-[14px] md:h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>

          <span className="text-game-text-muted text-xs font-mono hidden sm:inline-block">
            {gameState.guessedIds.length} correct / {gameState.tripPath.length > 2 ? gameState.tripPath.length - 2 : 0} stations
          </span>

          {gameState.isComplete && (
            <button
              id="btn-show-results"
              onClick={() => setShowResults(true)}
              className="px-4 py-2 md:px-3 md:py-1 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-semibold text-white transition-colors"
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
            tripPath={gameState.tripPath}
            hardMode={hardMode}
            darkMap={darkMap}
          />

          {/* MOBILE FLOATING OBJECTIVE (only visible on mobile, md:hidden) */}
          <div className="absolute top-3 left-3 right-16 md:hidden z-[1000] pointer-events-auto">
            <div className="glass-panel px-3 py-2 rounded-xl shadow-lg flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">Goal:</span>
                {mode === 'practice' ? (
                  <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                    <select
                      value={gameState.startId}
                      onChange={(e) => handlePracticeChange(e.target.value, gameState.targetId)}
                      className="bg-game-surface border border-game-border text-game-text text-[11px] rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold cursor-pointer truncate max-w-[45%]"
                    >
                      {stationsList.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-400 font-bold">↔</span>
                    <select
                      value={gameState.targetId}
                      onChange={(e) => handlePracticeChange(gameState.startId, e.target.value)}
                      className="bg-game-surface border border-game-border text-game-text text-[11px] rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold cursor-pointer truncate max-w-[45%]"
                    >
                      {stationsList.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-game-text font-bold text-[11px] truncate">
                    <span className="truncate max-w-[100px]">{startStation?.name}</span>
                    <span className="text-gray-400">↔</span>
                    <span className="truncate max-w-[100px]">{targetStation?.name}</span>
                  </div>
                )}
              </div>

              {gameState.tripLines && (
                <div className="flex items-center gap-1.5 mt-0.5 border-t border-game-border/30 pt-1">
                  <span className="text-gray-500 text-[10px]">Lines:</span>
                  <div className="flex flex-wrap gap-1">
                    {gameState.tripLines.map(lineId => {
                      const line = LINE_MAP[lineId];
                      return (
                        <span
                          key={lineId}
                          className="line-badge text-[9px] font-bold"
                          style={{
                            backgroundColor: line?.color,
                            color: line?.textColor,
                            padding: '1px 3px',
                            minWidth: '1.2rem',
                          }}
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

          {/* MOBILE FLOATING ACTIONS (only visible on mobile, md:hidden) */}
          {!gameState.isComplete && (
            <div className="absolute bottom-6 left-6 right-6 md:hidden z-[1000] flex flex-col gap-2 pointer-events-auto">
              <div className="glass-panel p-3 rounded-2xl shadow-xl flex flex-col gap-2.5">
                <StationInput
                  onGuess={handleGuess}
                  guessedIds={new Set([...gameState.guessedIds, ...gameState.wrongGuesses, gameState.startId, gameState.targetId])}
                  startId={gameState.startId}
                  targetId={gameState.targetId}
                  disabled={gameState.isComplete}
                />
                
                <div className="flex items-center justify-between gap-2 mt-1">
                  <button
                    onClick={() => setShowMobileTimeline(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border border-game-border hover:bg-game-surface/80 rounded-xl text-xs font-semibold text-game-text transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    <span>
                      Guesses ({gameState.guessedIds.length}/{gameState.tripPath.length > 2 ? gameState.tripPath.length - 2 : 0})
                    </span>
                    {gameState.wrongGuesses.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-mono text-[10px] font-bold">
                        {gameState.wrongGuesses.length} wrong
                      </span>
                    )}
                  </button>

                  {gameState.mode !== 'daily' && (
                    <button
                      onClick={handleGiveUp}
                      className="py-2 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/30 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 transition-colors"
                    >
                      Give Up
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {gameState.isComplete && (
            <div className="absolute bottom-6 left-6 right-6 md:hidden z-[1000]">
              <button
                onClick={() => setShowResults(true)}
                className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-500 rounded-xl text-sm font-bold text-white shadow-xl transition-all duration-200 text-center"
              >
                Show Results & Share
              </button>
            </div>
          )}
        </div>

        {/* SIDE PANEL */}
        <aside className="hidden md:flex w-72 shrink-0 glass-panel border-l border-game-border flex flex-col overflow-hidden z-10" id="side-panel">
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
              {gameState.mode !== 'daily' && (
                <button
                  onClick={handleGiveUp}
                  className="w-full py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/30 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 transition-colors"
                >
                  Give Up / Reveal Route
                </button>
              )}
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
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 pointer-events-none" style={{ zIndex: 100000 }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
            px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl border flex items-center gap-2.5 pointer-events-auto
            ${toast.type === 'success'
                ? 'bg-white text-emerald-950 border-emerald-300 dark:bg-slate-950 dark:text-emerald-50 dark:border-emerald-800'
                : toast.type === 'error'
                  ? 'bg-white text-rose-950 border-rose-300 dark:bg-slate-950 dark:text-rose-50 dark:border-rose-900'
                  : 'bg-white text-sky-950 border-sky-300 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-800'
              }
          `}
            style={{ animation: 'fadeInUp 0.3s ease-out forwards' }}
          >
            {toast.type === 'success' && (
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {toast.type === 'info' && (
              <svg className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="leading-tight">{toast.text}</span>
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
          dailyHistory={dailyHistory}
          date={gameState.date}
          addToast={addToast}
        />
      )}

      {/* ── HOW TO PLAY TUTORIAL ──────────────────────────────────── */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />

      {/* ── SETTINGS MODAL ────────────────────────────────────────── */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        hardMode={hardMode}
        toggleHardMode={toggleHardMode}
        theme={theme}
        toggleTheme={toggleTheme}
        darkMap={darkMap}
        toggleDarkMap={toggleDarkMap}
        addToast={addToast}
      />
      {/* ── MOBILE DRAWER ─────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[5000] md:hidden transition-opacity duration-300 ${
          showMobileTimeline ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowMobileTimeline(false)}
        />
        {/* Sheet */}
        <div
          className={`absolute bottom-6 left-6 right-6 max-h-[80vh] glass-panel bg-game-surface border border-game-border rounded-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-out ${
            showMobileTimeline ? 'translate-y-0' : 'translate-y-[calc(100%+1.5rem)]'
          }`}
        >
          {/* Drag Handle / Header */}
          <div className="px-4 py-3 border-b border-game-border flex items-center justify-between shrink-0">
            <h3 className="text-sm font-bold text-game-text">Route Timeline & Guesses</h3>
            <button
              onClick={() => setShowMobileTimeline(false)}
              className="p-1 text-game-text-muted hover:text-game-text"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Scrollable Guess History */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
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
        </div>
      </div>
    </main>
  );
}
