'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { STATIONS_DEDUPED } from '@/lib/networkData';
import type { Station } from '@/types';

interface StationInputProps {
  onGuess: (station: Station) => void;
  guessedIds: Set<string>;
  startId: string;
  targetId: string;
  disabled: boolean;
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-game-text font-bold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function StationInput({
  onGuess,
  guessedIds,
  startId,
  targetId,
  disabled,
}: StationInputProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Station[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Fuzzy / prefix search across all station names
  const search = useCallback((q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    const lower = q.toLowerCase().trim();
    const excludeIds = new Set([...guessedIds, startId, targetId]);

    const results = STATIONS_DEDUPED
      .filter(s => !excludeIds.has(s.id))
      .filter(s => {
        const name = s.name.toLowerCase();
        // prefix match first, then any contains
        return name.includes(lower);
      })
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        // Exact match first
        if (aName === lower) return -1;
        if (bName === lower) return 1;
        // Prefix match second
        if (aName.startsWith(lower) && !bName.startsWith(lower)) return -1;
        if (bName.startsWith(lower) && !aName.startsWith(lower)) return 1;
        return aName.localeCompare(bName);
      })
      .slice(0, 8);

    setSuggestions(results);
    setSelectedIdx(0);
    setIsOpen(results.length > 0);
  }, [guessedIds, startId, targetId]);


  const commit = useCallback((station: Station) => {
    onGuess(station);
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onGuess]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[selectedIdx]) {
        commit(suggestions[selectedIdx]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[selectedIdx] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIdx]);

  return (
    <div className="relative w-full">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              const val = e.target.value;
              setQuery(val);
              search(val);
            }}
            onKeyDown={onKeyDown}
            onFocus={() => query && setIsOpen(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setIsOpen(false), 150)}
            disabled={disabled}
            placeholder={disabled ? 'Game complete!' : 'Type a station…'}
            name="station_query"
            id="station-query-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            className={`
              w-full px-4 py-3 rounded-xl text-base md:text-sm font-medium
              bg-game-surface border border-game-border
              text-game-text placeholder-game-text-muted
              focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              transition-all duration-200
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-game-muted'}
            `}
          />
          {/* Search / Clear Button */}
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-game-text hover:bg-game-border/30 p-1.5 rounded-lg transition-colors flex items-center justify-center pointer-events-auto cursor-pointer"
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bottom-full mb-2 md:bottom-auto md:top-full md:mt-1 rounded-xl border border-game-border overflow-hidden shadow-2xl bg-game-panel backdrop-blur-md">
          <ul ref={listRef} className="max-h-64 overflow-y-auto custom-scroll">
            {suggestions.map((station, i) => (
              <li
                key={station.id}
                className={`autocomplete-item ${i === selectedIdx ? 'selected bg-blue-500/20' : ''}`}
                onMouseDown={() => commit(station)}
                onMouseEnter={() => setSelectedIdx(i)}
              >
                <span className="text-game-text text-sm flex-1">
                  {highlight(station.name, query)}
                </span>
              </li>
            ))}
          </ul>
          <div className="px-3 py-1.5 border-t border-game-border flex justify-between text-xs text-gray-600">
            <span>↑↓ navigate</span>
            <span>↵ select · esc close</span>
          </div>
        </div>
      )}
    </div>
  );
}
