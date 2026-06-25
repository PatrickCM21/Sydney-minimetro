'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import StationInput from '@/components/StationInput';
import GuessHistory from '@/components/GuessHistory';
import ResultsModal from '@/components/ResultsModal';
import HowToPlayModal from '@/components/HowToPlayModal';
import SettingsModal from '@/components/SettingsModal';
import { STATION_MAP, LINE_MAP, resolveStationId } from '@/lib/networkData';
import { findLinePath, getSharedLine, bfsShortestPathWithLines } from '@/lib/pathfinding';
import { getRandomChallenge, getDailyChallenge, getTodayString } from '@/lib/dailyChallenge';
import type { Station, GameState, LineId, DailyHistoryItem } from '@/types';
import linesData from '../../public/lines.json';

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
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = React.useRef(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [darkMap, setDarkMap] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [dailyHistory, setDailyHistory] = useState<DailyHistoryItem[]>([]);
  const [hardMode, setHardMode] = useState<boolean>(false);
  const [showMobileTimeline, setShowMobileTimeline] = useState<boolean>(false);
  const [devMode, setDevMode] = useState<boolean>(false);
  const [explorerDate, setExplorerDate] = useState<string>(() => getTodayString());
  const [isLocalhost, setIsLocalhost] = useState<boolean>(false);
  const [devRoute, setDevRoute] = useState<{ lineId: string; variantName: string; stationIds: string[] } | null>(null);
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);

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

  const saveDailyProgress = useCallback((guessedIds: string[], wrongGuesses: string[], isComplete: boolean, targetDate?: string) => {
    const progress = {
      date: targetDate || getTodayString(),
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

    // Send statistics atomically to the database only for today's challenge
    if (state.date === getTodayString()) {
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
    }

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
    const savedDevMode = localStorage.getItem('trackle_dev_mode') === 'true';
    const isLocal = window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.startsWith('10.');

    const timer = setTimeout(() => {
      setTheme(initialTheme);
      setHardMode(savedHardMode);
      setDarkMap(savedDarkMap);
      setDevMode(savedDevMode);
      setIsLocalhost(isLocal);
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleInitialZoomComplete = useCallback(() => {
    if (typeof window === 'undefined') return;
    const hasSeenTutorial = document.cookie.split('; ').some(row => row.startsWith('trackle_tutorial_seen='));
    if (!hasSeenTutorial) {
      setShowHelpPopup(true);
      // Auto-dismiss the reminder tooltip after 8 seconds
      setTimeout(() => {
        setShowHelpPopup(false);
      }, 8000);
      document.cookie = 'trackle_tutorial_seen=true; max-age=31536000; path=/; SameSite=Lax';
    }
  }, []);

  const addToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(t => [...t, { id, text, type }]);
    setTimeout(() => setToasts(t => t.filter(m => m.id !== id)), 3000);
  }, []);

  const toggleDevMode = useCallback(() => {
    setDevMode(prev => {
      const next = !prev;
      localStorage.setItem('trackle_dev_mode', String(next));
      return next;
    });
    addToast(!devMode ? "Developer mode enabled!" : "Developer mode disabled!", "info");
  }, [devMode, addToast]);

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
  const startGame = useCallback(async (m: 'daily' | 'practice', customStartId?: string, customTargetId?: string, targetDate?: string) => {
    let startId: string, targetId: string;
    let challengeDate: string | undefined;

    if (m === 'daily') {
      let challenge: { start: string; target: string; date: string } | null = null;

      if (targetDate) {
        challenge = getDailyChallenge(targetDate);
      } else {
        const cached = localStorage.getItem('trackle_daily_challenge_cached');
        const todayStr = getTodayString();
        let needsFetch = true;

        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.date === todayStr) {
              challenge = parsed;
              needsFetch = false;
            }
          } catch (e) {
            // Ignored, needsFetch remains true
          }
        }

        if (needsFetch) {
          try {
            const res = await fetch('/api/daily');
            if (res.ok) {
              challenge = await res.json();
              if (challenge) {
                localStorage.setItem('trackle_daily_challenge_cached', JSON.stringify(challenge));
              }
            }
          } catch (e) {
            console.error("Failed to fetch daily challenge", e);
          }
        }

        if (!challenge) {
          challenge = getDailyChallenge(getTodayString());
        }
      }

      startId = challenge.start;
      targetId = challenge.target;
      challengeDate = challenge.date;

      // Clear url params
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
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

    startId = resolveStationId(startId);
    targetId = resolveStationId(targetId);

    if (m === 'daily') {
      const sStation = STATION_MAP.get(startId);
      const tStation = STATION_MAP.get(targetId);
      if (sStation && tStation && tStation.lng < sStation.lng) {
        const temp = startId;
        startId = targetId;
        targetId = temp;
      }
    }

    if (m === 'practice') {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams();
        searchParams.set('mode', 'practice');
        searchParams.set('start', startId);
        searchParams.set('target', targetId);
        window.history.replaceState({}, '', `?${searchParams.toString()}`);
      }
    }

    if (startId === targetId) {
      addToast("Start and end stations must be different!", "error");
      return;
    }

    const pathWithLines = bfsShortestPathWithLines(startId, targetId);
    let tripPath: string[] = [];
    let tripLines: LineId[] = [];

    const line = getSharedLine(startId, targetId);
    const singleLinePath = line ? (findLinePath(startId, targetId, line) ?? []) : [];

    // If there is a single-line route AND it is not excessively longer than the optimal transfer route, use it.
    if (line && singleLinePath.length > 0 &&
      (!pathWithLines || singleLinePath.length <= pathWithLines.path.length + 6)) {
      tripPath = singleLinePath;
      tripLines = [line];
    } else if (pathWithLines) {
      tripPath = pathWithLines.path;
      tripLines = pathWithLines.lines;
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
            state.guessedIds = (parsed.guessedIds || []).map(resolveStationId);
            state.wrongGuesses = (parsed.wrongGuesses || []).map(resolveStationId);
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

  const handleHeaderShare = useCallback(async () => {
    if (!gameState) return;
    const { mode, startId, targetId } = gameState;
    const url = new URL(window.location.origin + window.location.pathname);

    let text = '';
    const startName = STATION_MAP.get(startId)?.name ?? startId;
    const targetName = STATION_MAP.get(targetId)?.name ?? targetId;

    if (mode === 'practice') {
      url.searchParams.set('mode', 'practice');
      url.searchParams.set('start', startId);
      url.searchParams.set('target', targetId);
      text = `Try this Trackle Practice Route: ${startName} ↔ ${targetName}\n${url.toString()}`;
    } else {
      text = `Try today's Trackle Daily Challenge!\n${url.toString()}`;
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: mode === 'practice' ? `Trackle Practice: ${startName} ↔ ${targetName}` : 'Trackle Daily Challenge',
          text: text,
          url: url.toString(),
        });
        addToast("Shared successfully!", "success");
      } catch (err) {
        // If sharing is cancelled by user, don't show an error toast
        if (err instanceof Error && err.name !== 'AbortError') {
          addToast("Failed to share.", "error");
        }
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => addToast("Challenge link copied to clipboard!", "success"))
        .catch(() => addToast("Failed to copy link.", "error"));
    } else {
      addToast("Clipboard not supported.", "error");
    }
  }, [gameState, addToast]);

  // Initialize on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const searchParams = new URLSearchParams(window.location.search);
      const urlMode = searchParams.get('mode');
      const urlStart = searchParams.get('start');
      const urlTarget = searchParams.get('target');

      if (urlMode === 'practice' && urlStart && urlTarget) {
        startGame('practice', urlStart, urlTarget);
      } else {
        startGame('daily');
      }
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
        saveDailyProgress(newGuessedIds, wrongGuesses, allGuessed, gameState.date);
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
        saveDailyProgress(guessedIds, newWrongGuesses, isFailed, gameState.date);
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
      saveDailyProgress(gameState.guessedIds, gameState.wrongGuesses, true, gameState.date);
      saveToDailyHistory(newState);
    }

    setTimeout(() => setShowResults(true), 400);
  }, [gameState, saveDailyProgress, saveToDailyHistory]);

  const handlePlayAgain = useCallback(() => {
    startGame('practice');
  }, [startGame]);

  const handleCloseTutorial = useCallback(() => {
    setShowHowToPlay(false);
  }, []);

  const handleExplorerDateChange = useCallback((offsetDays: number) => {
    setExplorerDate(prevDate => {
      const d = new Date(prevDate + 'T12:00:00');
      d.setDate(d.getDate() + offsetDays);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const newDate = `${year}-${month}-${day}`;
      startGame('daily', undefined, undefined, newDate);
      return newDate;
    });
  }, [startGame]);

  if (!gameState) {
    return (
      <div className="w-full h-dvh flex items-center justify-center bg-game-bg">
        <div className="text-gray-500 animate-pulse text-sm">Loading challenge…</div>
      </div>
    );
  }

  // Dev Route Viewer overrides
  const isDevRouteViewerActive = devMode && devRoute !== null;
  const startId = isDevRouteViewerActive ? devRoute.stationIds[0] : gameState.startId;
  const targetId = isDevRouteViewerActive ? devRoute.stationIds[devRoute.stationIds.length - 1] : gameState.targetId;
  const guessedIds = isDevRouteViewerActive ? devRoute.stationIds : gameState.guessedIds;
  const optimalPath = isDevRouteViewerActive ? devRoute.stationIds : gameState.optimalPath;
  const isComplete = isDevRouteViewerActive ? true : gameState.isComplete;
  const wrongGuesses = isDevRouteViewerActive ? [] : gameState.wrongGuesses;
  const tripLines = isDevRouteViewerActive ? [devRoute.lineId as LineId] : gameState.tripLines;
  const tripPath = isDevRouteViewerActive ? devRoute.stationIds : gameState.tripPath;

  const startStation = STATION_MAP.get(startId);
  const targetStation = STATION_MAP.get(targetId);

  return (
    <main className="w-full h-dvh flex flex-col overflow-hidden" id="main-game">
      {/* ── DEVELOPER TOOLBAR ─────────────────────────────────────── */}
      {isLocalhost && devMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs text-amber-700 dark:text-amber-400 font-semibold z-[1900] shadow-sm">
          {/* Daily Challenge Date Explorer */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider shrink-0">
              Dev Explorer
            </span>
            <span className="text-gray-600 dark:text-gray-300">Daily Challenge:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleExplorerDateChange(-1)}
                className="px-2 py-0.5 hover:bg-amber-500/20 active:scale-95 rounded text-amber-700 dark:text-amber-300 font-bold transition-all border border-amber-500/20"
                title="Previous Day"
              >
                ◀ Day
              </button>
              <input
                type="date"
                value={explorerDate}
                onChange={(e) => {
                  setExplorerDate(e.target.value);
                  startGame('daily', undefined, undefined, e.target.value);
                }}
                className="bg-game-surface border border-game-border rounded px-2 py-0.5 text-xs text-game-text focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
              />
              <button
                onClick={() => handleExplorerDateChange(1)}
                className="px-2 py-0.5 hover:bg-amber-500/20 active:scale-95 rounded text-amber-700 dark:text-amber-300 font-bold transition-all border border-amber-500/20"
                title="Next Day"
              >
                Day ▶
              </button>
            </div>
          </div>

          {/* Route Viewer */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-600 dark:text-gray-300">Route Viewer:</span>
            <select
              value={devRoute?.lineId || ''}
              onChange={(e) => {
                const lineId = e.target.value;
                if (!lineId) {
                  setDevRoute(null);
                  return;
                }
                const lineInfo = (linesData as any)[lineId];
                const firstVariant = Object.keys(lineInfo.variants)[0];
                setDevRoute({
                  lineId,
                  variantName: firstVariant,
                  stationIds: lineInfo.variants[firstVariant],
                });
              }}
              className="bg-game-surface border border-game-border rounded px-2 py-0.5 text-xs text-game-text focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
            >
              <option value="">-- Select Line --</option>
              {Object.entries(linesData).map(([id, info]: [string, any]) => (
                <option key={id} value={id}>
                  {id} - {info.displayName}
                </option>
              ))}
            </select>

            {devRoute && (
              <>
                <select
                  value={devRoute.variantName}
                  onChange={(e) => {
                    const variantName = e.target.value;
                    const lineInfo = (linesData as any)[devRoute.lineId];
                    setDevRoute({
                      ...devRoute,
                      variantName,
                      stationIds: lineInfo.variants[variantName],
                    });
                  }}
                  className="bg-game-surface border border-game-border rounded px-2 py-0.5 text-xs text-game-text focus:outline-none focus:border-amber-500 cursor-pointer font-medium max-w-[120px] sm:max-w-none"
                >
                  {Object.keys((linesData as any)[devRoute.lineId].variants).map(vName => (
                    <option key={vName} value={vName}>
                      {vName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setDevRoute(null)}
                  className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold transition-all border border-red-700"
                >
                  Exit Viewer
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TOP NAV ───────────────────────────────────────────────── */}
      <nav className="relative glass-panel border-b border-game-border z-[2000] flex items-center justify-between px-4 py-2 md:py-2.5 md:px-6 shrink-0" id="nav-bar">
        <div className="flex items-center gap-3 md:gap-3.5">
          {/* Logo */}
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/trackle_logo.png" alt="Trackle Logo" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
            <span className="text-game-text font-bold text-sm md:text-base hidden sm:block">Trackle</span>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 bg-game-surface rounded-lg p-0.5 ml-2 md:ml-3">
            {(['daily', 'practice'] as const).map(m => (
              <button
                key={m}
                id={`mode-${m}`}
                onClick={() => startGame(m)}
                className={`px-4 py-2 md:px-3 md:py-1 rounded-md text-xs md:text-sm font-semibold transition-all duration-200 capitalize ${mode === m
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
        <div className="hidden md:flex items-center gap-2 md:gap-2.5 text-sm md:text-base">
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
              <span className="text-gray-500 font-semibold md:text-base">↔</span>
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
                  <span className="text-game-text font-bold md:text-base">{startStation.name}</span>
                </div>
              )}
              <span className="text-gray-500 font-bold md:text-base">↔</span>
              {targetStation && (
                <div className="flex items-center gap-2">
                  <span className="text-game-text font-bold md:text-base">{targetStation.name}</span>
                </div>
              )}
            </>
          )}
          {gameState.tripLines && (
            <div className="hidden sm:flex items-center gap-1.5 ml-4 border-l border-game-border pl-4">
              <span className="text-gray-500 dark:text-white text-xs md:text-sm font-medium">Use lines:</span>
              {gameState.tripLines.map(lineId => {
                const line = LINE_MAP[lineId];
                return (
                  <span
                    key={lineId}
                    className="line-badge text-xs md:text-sm font-semibold md:px-2 md:py-0.5"
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
        <div className="flex items-center gap-2 md:gap-2.5">
          {/* Portfolio Button */}
          <a
            href="https://patrickcm.dev/profile"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 md:p-1.5 rounded-lg border border-game-border hover:bg-game-surface text-game-text-muted hover:text-game-text transition-colors flex items-center justify-center"
            aria-label="my portfolio"
            title="My Portfolio"
          >
            <svg
              className="w-5 h-5 md:w-[15px] md:h-[15px]"
              viewBox="0 0 88.473015 88.321014"
              fill="currentColor"
            >
              <path d="m 88.473015,44.237014 c 0,23.238 -17.918,42.275 -40.689,44.084 l -9.803,-23.71 c 1.374,-2.009 2.179,-4.436 2.179,-7.047 0,-0.234 -0.008,-0.467 -0.021,-0.698 l 15.283,-10.544 c 0.073,0 0.144,10e-4 0.216,10e-4 9.199,0 16.683,-7.483 16.683,-16.683 0,-9.199 -7.484,-16.682 -16.683,-16.682 -9.199,0 -16.684,7.483 -16.684,16.682 0,0.127 0.003,0.253 0.006,0.379 l -10.73,15.038 c -0.195,-0.008 -0.394,-0.015 -0.592,-0.015 -6.906,0 -12.522,5.617 -12.522,12.522 0,6.061 4.326,11.129 10.055,12.277 l 7.01,16.956 C 13.613015,81.547014 0,64.488014 0,44.237014 0,19.805014 19.806015,0 44.235015,0 c 24.433,0 44.238,19.806014 44.238,44.237014 z" />
              <path d="m 21.351015,60.600014 2.245,5.434 c -2.005,-0.963 -3.684,-2.629 -4.606,-4.841 -1.992,-4.782 0.277,-10.295 5.063,-12.288 2.314,-0.965 4.869,-0.971 7.189,-0.014 2.321,0.955 4.131,2.757 5.097,5.074 0.957,2.299 0.922,4.762 0.105,6.926 l -2.321,-5.613 c -1.47,-3.527 -5.52,-5.195 -9.047,-3.725 -3.528,1.467 -5.196,5.52 -3.725,9.047 z" />
              <path d="m 55.638015,18.525014 c 6.129,0 11.116,4.986 11.116,11.116 0,6.129 -4.987,11.116 -11.116,11.116 -6.13,0 -11.115,-4.987 -11.115,-11.116 10e-4,-6.13 4.986,-11.116 11.115,-11.116 z m 0.019,19.448 c 4.612,0 8.35,-3.739 8.35,-8.351 0,-4.612 -3.738,-8.351 -8.35,-8.351 -4.612,0 -8.35,3.739 -8.35,8.351 0,4.612 3.739,8.351 8.35,8.351 z" />
            </svg>
          </a>

          {/* Help Button */}
          <div className="relative">
            <button
              onClick={() => { setShowHowToPlay(true); setShowHelpPopup(false); }}
              className="p-2.5 md:p-1.5 rounded-lg border border-game-border hover:bg-game-surface text-game-text-muted hover:text-game-text transition-colors flex items-center justify-center"
              aria-label="help"
              title="Help"
            >
              <svg className="w-5 h-5 md:w-[15px] md:h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
              </svg>
            </button>
            {showHelpPopup && (
              <div className="absolute right-0 top-full mt-2 w-56 md:w-64 bg-blue-600 dark:bg-blue-500 text-white text-sm px-4 py-2.5 md:py-3 rounded-xl shadow-xl z-[2100] animate-bounce-subtle">
                <div className="absolute top-0 right-3.5 -mt-1 w-2 h-2 bg-blue-600 dark:bg-blue-500 transform rotate-45"></div>
                <div className="flex flex-col gap-1.5">
                  <div className="font-bold flex items-center justify-between">
                    <span>Need the rules?</span>
                    <button
                      onClick={() => setShowHelpPopup(false)}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white font-extrabold text-sm transition-colors shrink-0 ml-1.5"
                      aria-label="Close rules helper"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-blue-100 leading-tight">Click this button anytime to check the rules!</p>
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 md:p-1.5 rounded-lg border border-game-border hover:bg-game-surface text-game-text-muted hover:text-game-text transition-colors flex items-center justify-center"
            aria-label="settings"
            title="Settings"
          >
            <svg className="w-5 h-5 md:w-[15px] md:h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>

          <span className="text-game-text-muted text-xs md:text-sm font-mono hidden sm:inline-block">
            {guessedIds.length} correct / {tripPath.length > 2 ? tripPath.length - 2 : 0} stations
          </span>

          {isComplete && !isDevRouteViewerActive && (
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
            startId={startId}
            targetId={targetId}
            guessedIds={guessedIds}
            optimalPath={isComplete ? optimalPath : undefined}
            isComplete={isComplete}
            wrongGuesses={wrongGuesses}
            tripLines={tripLines}
            tripPath={tripPath}
            hardMode={hardMode}
            darkMap={darkMap}
            hoveredStationId={hoveredStationId}
            mode={mode}
            onInitialZoomComplete={handleInitialZoomComplete}
          />

          {/* MOBILE FLOATING OBJECTIVE (only visible on mobile, md:hidden) */}
          <div className="absolute top-3 left-3 right-16 md:hidden z-[1000] pointer-events-auto">
            <div className="glass-panel px-3 py-2 rounded-xl shadow-lg flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-gray-500 dark:text-white font-medium">Goal:</span>
                  {mode === 'practice' && !isDevRouteViewerActive ? (
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
                <button
                  onClick={handleHeaderShare}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-[9px] font-bold text-white shadow transition-all duration-200 flex items-center gap-1 shrink-0"
                  title="Share this challenge link"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  Share
                </button>
              </div>

              {tripLines && (
                <div className="flex items-center gap-1.5 mt-0.5 border-t border-game-border/30 pt-1">
                  <span className="text-gray-500 dark:text-white text-[10px]">Lines:</span>
                  <div className="flex flex-wrap gap-1">
                    {tripLines.map(lineId => {
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
          {!isComplete && (
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

                  {(gameState.mode !== 'daily' || (isLocalhost && devMode)) && (
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

          {isComplete && !isDevRouteViewerActive && (
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
        <aside className="hidden md:flex w-72 md:w-80 shrink-0 glass-panel border-l border-game-border flex flex-col overflow-hidden z-10" id="side-panel">
          {isDevRouteViewerActive ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-fade-in">
              {/* Header */}
              <div className="px-4 py-4 border-b border-game-border flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-500 font-bold uppercase tracking-wider">
                    Dev Route Viewer
                  </span>
                  <button
                    onClick={() => setDevRoute(null)}
                    className="px-2 py-0.5 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-500/20 rounded text-[10px] font-bold transition-all"
                  >
                    Exit Viewer
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="line-badge text-xs font-bold shrink-0 animate-fade-in animate-pulse-slow"
                    style={{
                      backgroundColor: (linesData as any)[devRoute.lineId]?.color || '#888',
                      color: '#fff',
                      minWidth: '1.4rem',
                      height: '1.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '9999px',
                    }}
                  >
                    {devRoute.lineId}
                  </span>
                  <span className="text-sm font-semibold text-game-text truncate">
                    {(linesData as any)[devRoute.lineId]?.displayName}
                  </span>
                </div>
                <div className="text-[10px] text-game-text-muted mt-0.5">
                  Variant: <span className="font-mono text-amber-400">{devRoute.variantName}</span> ({devRoute.stationIds.length} stations)
                </div>
              </div>

              {/* Station List */}
              <div className="flex-1 overflow-y-auto custom-scroll px-3 py-3 flex flex-col gap-1.5 min-h-0">
                {devRoute.stationIds.map((id, index) => {
                  const station = STATION_MAP.get(id);
                  if (!station) return null;
                  const isHovered = id === hoveredStationId;

                  return (
                    <React.Fragment key={id}>
                      <div
                        onMouseEnter={() => setHoveredStationId(id)}
                        onMouseLeave={() => setHoveredStationId(null)}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer
                          ${isHovered
                            ? 'bg-amber-500/25 border border-amber-500/50 text-game-text shadow-glow-orange/10 scale-[1.02]'
                            : 'bg-game-surface/40 hover:bg-game-surface/75 border border-game-border/30 text-game-text-muted'}
                        `}
                      >
                        <div className="shrink-0 w-5 text-center text-xs font-mono font-bold text-gray-500">
                          {index + 1}
                        </div>

                        {/* Station Name */}
                        <span className="flex-1 truncate font-semibold">
                          {station.name}
                        </span>

                        {/* Station Code */}
                        <span className="text-[9px] font-mono bg-black/30 border border-white/5 px-1 py-0.2 rounded text-gray-400">
                          {id.replace('STN-', '')}
                        </span>
                      </div>

                      {index < devRoute.stationIds.length - 1 && (
                        <div className="flex justify-center my-0.5">
                          <div
                            className="w-0.5 h-3 transition-colors duration-200"
                            style={{
                              backgroundColor: isHovered
                                ? (linesData as any)[devRoute.lineId]?.color || '#888'
                                : 'var(--game-border)'
                            }}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-game-border bg-game-surface/20 shrink-0 text-center">
                <span className="text-[10px] text-game-text-muted italic">
                  Hover over stations to highlight them on the map
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Challenge info */}
              <div className="px-4 pt-4 pb-3 border-b border-game-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider truncate mr-1">
                    {mode === 'daily' ? `Daily Challenge · ${getTodayString()}` : 'Practice Mode'}
                  </span>
                  <button
                    onClick={handleHeaderShare}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-[10px] font-bold text-white shadow transition-all duration-200 flex items-center gap-1 shrink-0"
                    title="Share this challenge link"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    Share
                  </button>
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
                  {(gameState.mode !== 'daily' || (isLocalhost && devMode)) && (
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

            </>
          )}
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
      {isComplete && !isDevRouteViewerActive && (
        <ResultsModal
          isOpen={showResults}
          startId={startId}
          targetId={targetId}
          optimalPath={optimalPath}
          userPath={gameState.userPath ?? null}
          guessedIds={guessedIds}
          wrongGuesses={wrongGuesses}
          tripLines={tripLines}
          onPlayAgain={handlePlayAgain}
          onClose={() => setShowResults(false)}
          mode={mode}
          dailyHistory={dailyHistory}
          date={isDevRouteViewerActive ? undefined : gameState.date}
          addToast={addToast}
        />
      )}

      {/* ── HOW TO PLAY TUTORIAL ──────────────────────────────────── */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={handleCloseTutorial}
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
        devMode={devMode}
        toggleDevMode={toggleDevMode}
      />
      {/* ── MOBILE DRAWER ─────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[5000] md:hidden transition-opacity duration-300 ${showMobileTimeline ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowMobileTimeline(false)}
        />
        {/* Sheet */}
        <div
          className={`absolute bottom-6 left-6 right-6 max-h-[80vh] glass-panel bg-game-surface border border-game-border rounded-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-out ${showMobileTimeline ? 'translate-y-0' : 'translate-y-[calc(100%+1.5rem)]'
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
              guessedIds={guessedIds}
              startId={startId}
              targetId={targetId}
              userPath={gameState.userPath ?? null}
              isComplete={isComplete}
              wrongGuesses={wrongGuesses}
              tripPath={tripPath}
              tripLines={tripLines}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
