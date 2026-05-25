'use client';

import React, { useEffect, useRef } from 'react';
import { STATION_MAP, LINE_MAP } from '@/lib/networkData';

interface ResultsModalProps {
  isOpen: boolean;
  startId: string;
  targetId: string;
  optimalPath: string[];
  userPath: string[] | null;
  guessedIds: string[];
  onPlayAgain: () => void;
  onClose: () => void;
  mode: 'daily' | 'practice';
}

function PathDisplay({ path, color, label }: { path: string[]; color: string; label: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-xs text-gray-500 font-mono ml-auto">{path.length - 1} stop{path.length - 1 !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {path.map((id, i) => {
          const station = STATION_MAP.get(id);
          if (!station) return null;
          const line = LINE_MAP[station.lines[0]];
          return (
            <React.Fragment key={id}>
              <div className="flex items-center gap-1">
                <span
                  className="line-badge text-xs"
                  style={{ backgroundColor: line.color, color: line.textColor, fontSize: '9px', padding: '1px 4px' }}
                >
                  {station.lines[0]}
                </span>
                <span className="text-xs text-gray-300">{station.name}</span>
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

function ScoreBadge({ diff }: { diff: number }) {
  if (diff === 0) {
    return (
      <div className="text-center">
        <div className="text-5xl font-black text-green-400 mb-1" style={{ textShadow: '0 0 30px rgba(34,197,94,0.5)' }}>
          PERFECT!
        </div>
        <div className="text-gray-400 text-sm">You found the optimal route! 🎉</div>
      </div>
    );
  }
  if (diff <= 2) {
    return (
      <div className="text-center">
        <div className="text-5xl font-black text-blue-400 mb-1" style={{ textShadow: '0 0 30px rgba(59,130,246,0.5)' }}>
          +{diff}
        </div>
        <div className="text-gray-400 text-sm">Just {diff} stop{diff !== 1 ? 's' : ''} longer than optimal</div>
      </div>
    );
  }
  if (diff <= 5) {
    return (
      <div className="text-center">
        <div className="text-5xl font-black text-amber-400 mb-1" style={{ textShadow: '0 0 30px rgba(245,158,11,0.5)' }}>
          +{diff}
        </div>
        <div className="text-gray-400 text-sm">{diff} stops longer than optimal</div>
      </div>
    );
  }
  return (
    <div className="text-center">
      <div className="text-5xl font-black text-red-400 mb-1" style={{ textShadow: '0 0 30px rgba(239,68,68,0.5)' }}>
        +{diff}
      </div>
      <div className="text-gray-400 text-sm">{diff} stops off — try again in practice mode!</div>
    </div>
  );
}

export default function ResultsModal({
  isOpen,
  startId,
  targetId,
  optimalPath,
  userPath,
  guessedIds,
  onPlayAgain,
  onClose,
  mode,
}: ResultsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const optimalStops = optimalPath.length - 1;
  const userStops = userPath ? userPath.length - 1 : null;
  const diff = userPath && userStops !== null ? userStops - optimalStops : null;

  const handleCopyResult = () => {
    const start = STATION_MAP.get(startId)?.name ?? startId;
    const target = STATION_MAP.get(targetId)?.name ?? targetId;
    const score = diff !== null ? (diff === 0 ? 'PERFECT!' : `+${diff} stops`) : 'DNF';
    const text = [
      `🚇 Sydney MiniMetro`,
      `${start} → ${target}`,
      `Optimal: ${optimalStops} stops | Mine: ${userStops ?? '?'} stops`,
      `Score: ${score}`,
      `Total guesses: ${guessedIds.length}`,
    ].join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  if (!isOpen) return null;

  const startName = STATION_MAP.get(startId)?.name ?? startId;
  const targetName = STATION_MAP.get(targetId)?.name ?? targetId;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
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
                {diff === 0 ? '🏆 Perfect Route!' : '🚉 Route Complete'}
              </h2>
              <p className="text-sm text-gray-500">
                <span className="text-green-400 font-medium">{startName}</span>
                <span className="mx-2">→</span>
                <span className="text-red-400 font-medium">{targetName}</span>
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
          {diff !== null ? (
            <ScoreBadge diff={diff} />
          ) : (
            <div className="text-center text-gray-500">No connected path found</div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-game-border border-b border-game-border">
          {[
            { label: 'Your stops', value: userStops !== null ? userStops : '—', color: '#f59e0b' },
            { label: 'Optimal stops', value: optimalStops, color: '#22c55e' },
            { label: 'Total guesses', value: guessedIds.length, color: '#60a5fa' },
          ].map(({ label, value, color }) => (
            <div key={label} className="px-4 py-3 text-center">
              <div className="text-2xl font-black" style={{ color }}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Route comparison */}
        <div className="px-6 py-4 space-y-4 max-h-52 overflow-y-auto custom-scroll border-b border-game-border">
          {userPath && <PathDisplay path={userPath} color="#f59e0b" label="Your route" />}
          <PathDisplay path={optimalPath} color="#22c55e" label="Optimal route" />
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
