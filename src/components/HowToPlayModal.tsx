'use client';

import React, { useRef, useEffect } from 'react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', zIndex: 99999 }}
      onClick={e => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="w-full max-w-lg glass-panel rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ animation: 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-game-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/trackle_logo.png" alt="Trackle Logo" className="w-8 h-8 object-contain" />
            <h2 className="text-xl font-extrabold text-game-text">How to Play Trackle</h2>
          </div>
          <button
            onClick={onClose}
            className="text-game-text-muted hover:text-game-text transition-colors p-1"
            aria-label="Close instructions"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[70vh] flex flex-col gap-6 custom-scroll">
          <p className="text-sm text-game-text-muted leading-relaxed">
            Welcome to <strong className="font-extrabold text-game-text">Trackle</strong>, the daily shortest path quiz for Sydney&apos;s transit network.
            Your goal is to guess the route with the <strong className="text-game-text font-bold text-orange-500">least number of stops</strong> (not necessarily the shortest physical distance) connecting the two stations.
          </p>

          <div className="flex flex-col gap-5">
            {/* Step 1 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-orange-500/10 text-orange-700 dark:text-orange-400 flex items-center justify-center font-bold text-sm border border-orange-500/20">
                1
              </div>
              <div>
                <h3 className="font-bold text-sm text-game-text mb-1">Check the Route & Lines</h3>
                <p className="text-xs text-game-text-muted leading-relaxed">
                  Look at the start and end stations in the sidebar. The <strong className="font-bold text-game-text">line symbols</strong> (e.g., <span className="px-1.5 py-0.5 rounded bg-[#f28d21] text-white font-bold text-[9px]">T1</span>, <span className="px-1.5 py-0.5 rounded bg-[#066fb6] text-white font-bold text-[9px]">T8</span>) will tell you the path to consider.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/20">
                2
              </div>
              <div>
                <h3 className="font-bold text-sm text-game-text mb-1">Guess Intermediate Stations</h3>
                <p className="text-xs text-game-text-muted leading-relaxed">
                  Type and enter names of stations you believe lie between the two endpoints. You can search from any station on the network.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-red-500/10 text-red-700 dark:text-red-400 flex items-center justify-center font-bold text-sm border border-red-500/20">
                3
              </div>
              <div>
                <h3 className="font-bold text-sm text-game-text mb-1">Be careful with your guesses!</h3>
                <p className="text-xs text-game-text-muted leading-relaxed">
                  Guessing the wrong station will cost you one of your five available guesses.
                </p>
              </div>
            </div>

          </div>

          <div className="p-3 bg-game-surface/30 rounded-xl border border-game-border/30 mt-2">
            <div className="text-xs font-semibold text-game-text mb-1 flex items-center gap-1">
              Game Modes
            </div>
            <p className="text-[11px] text-game-text-muted leading-relaxed">
              • <strong className="font-bold text-game-text">Daily Challenge</strong>: The same route for everyone, updated every day.
              <br />
              • <strong className="font-bold text-game-text">Practice Mode</strong>: Choose your own route to <span className="font-bold italic text-game-text">train</span> your Sydney network knowledge anytime.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-game-border flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-2 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-md hover:shadow-blue-500/20"
          >
            Let&apos;s Play!
          </button>
        </div>
      </div>
    </div>
  );
}
