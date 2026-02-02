"use client";

import { useEffect, useState } from "react";

export function MemoryAidsModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-2.5 -my-1 rounded-lg text-zinc-200 hover:bg-white/5 transition-colors touch-manipulation"
        title="Memory aids"
        type="button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
        aria-label="Close modal"
        onClick={() => setIsOpen(false)}
      />

      {/* Layout wrapper (prevents top cut-off on tall modals) */}
      <div className="relative flex min-h-dvh items-start justify-center p-4 sm:items-center">
        {/* Modal panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Memory aids"
          className="
            w-full max-w-2xl
            rounded-xl bg-zinc-900
            border border-zinc-800
            shadow-2xl
            max-h-[calc(100dvh-2rem)]
            overflow-y-auto
          "
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-100">Memory Aids</h3>

              <button
                onClick={() => setIsOpen(false)}
            className="p-2.5 text-zinc-400 hover:text-zinc-200 transition-colors rounded-md hover:bg-zinc-800/60 touch-manipulation"
            type="button"
            aria-label="Close"
          >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <p className="text-sm text-zinc-300 mb-4">
              Quick mnemonics for both clefs to help you remember staff positions.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-4">
              <div className="rounded-md bg-zinc-800/50 p-3 border border-zinc-700/60">
                <div className="font-semibold text-zinc-100 text-sm mb-1">
                  Treble Lines (EGBDF)
                </div>
                <div className="text-zinc-300 text-sm">Every Good Boy Deserves Fruit</div>
              </div>

              <div className="rounded-md bg-zinc-800/50 p-3 border border-zinc-700/60">
                <div className="font-semibold text-zinc-100 text-sm mb-1">
                  Treble Spaces (FACE)
                </div>
                <div className="text-zinc-300 text-sm">FACE spells FACE</div>
              </div>

              <div className="rounded-md bg-zinc-800/50 p-3 border border-zinc-700/60">
                <div className="font-semibold text-zinc-100 text-sm mb-1">
                  Bass Lines (GBDFA)
                </div>
                <div className="text-zinc-300 text-sm">Good Burritos Don&apos;t Fall Apart</div>
              </div>

              <div className="rounded-md bg-zinc-800/50 p-3 border border-zinc-700/60">
                <div className="font-semibold text-zinc-100 text-sm mb-1">
                  Bass Spaces (ACEG)
                </div>
                <div className="text-zinc-300 text-sm">All Cows Eat Grass</div>
              </div>
            </div>

            <div className="rounded-md bg-zinc-800/40 px-3 py-2 text-xs text-zinc-300 border border-zinc-700/50">
              Weak notes are selected more often based on recent accuracy. Stats are stored locally in your browser.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
