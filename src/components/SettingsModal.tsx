'use client';

import React, { useRef, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hardMode: boolean;
  toggleHardMode: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  darkMap: boolean;
  toggleDarkMap: () => void;
  addToast?: (text: string, type?: 'info' | 'success' | 'error') => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  hardMode,
  toggleHardMode,
  theme,
  toggleTheme,
  darkMap,
  toggleDarkMap,
  addToast,
}: SettingsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = React.useState('');
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback,
          mode: 'settings', // Mark as settings menu feedback
          score: 0,
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
      style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(1px)', zIndex: 99999 }}
      onClick={e => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="w-full max-w-[30%] glass-panel rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-game-surface mx-4"
        style={{ animation: 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-game-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-game-text">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <h2 className="text-lg font-extrabold text-game-text">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-game-text-muted hover:text-game-text transition-colors p-1"
            aria-label="Close settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 flex flex-col gap-6">
          {/* Game Difficulty */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-sm font-bold text-game-text">Hard Mode</span>
              <span className="text-[10px] text-game-text-muted leading-tight">
                Only show tracks directly adjacent to correct guesses
              </span>
            </div>
            <button
              onClick={toggleHardMode}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${hardMode ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-800'
                }`}
              aria-label="Toggle Hard Mode"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hardMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          <hr className="border-game-border" />

          {/* App Lighting */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-sm font-bold text-game-text">Dark Theme</span>
              <span className="text-[10px] text-game-text-muted leading-tight">
                Toggle between light and dark interface
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${theme === 'dark' ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-800'
                }`}
              aria-label="Toggle Dark Theme"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          <hr className="border-game-border" />

          {/* Map Lighting */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-sm font-bold text-game-text">Dark Map</span>
              <span className="text-[10px] text-game-text-muted leading-tight">
                Use dark-themed styling for the map view
              </span>
            </div>
            <button
              onClick={toggleDarkMap}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${darkMap ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-800'
                }`}
              aria-label="Toggle Dark Map"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${darkMap ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          <hr className="border-game-border" />

          {/* Feedback Form */}
          <div className="flex flex-col gap-2">
            {!showFeedback ? (
              <button
                onClick={() => setShowFeedback(true)}
                className="w-full py-2 border border-game-border hover:bg-game-surface/80 text-game-text-muted hover:text-game-text rounded-xl text-xs font-bold transition-all duration-200"
              >
                Give Feedback / Report a Bug
              </button>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-2 bg-game-surface/30 p-3 rounded-xl border border-game-border/30">
                <div className="text-xs font-bold text-game-text">Give Feedback</div>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Suggestions or bug reports..."
                  rows={3}
                  required
                  className="w-full text-xs p-2 bg-game-bg border border-game-border rounded-lg text-game-text focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFeedback(false);
                      setSubmitStatus('idle');
                    }}
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
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-game-border flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-md hover:shadow-blue-500/20"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
