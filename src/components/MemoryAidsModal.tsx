import { useState } from "react";

export function MemoryAidsModal() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
        title="Memory aids"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl z-50">
        <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-100">Memory Aids</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-white/5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-slate-300 mb-4">
            Quick mnemonics for both clefs to help you remember staff positions.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-4">
            <div className="rounded-lg bg-blue-500/10 p-3 ring-1 ring-blue-400/20">
              <div className="font-semibold text-blue-100 text-sm mb-1">Treble Lines (EGBDF)</div>
              <div className="text-blue-200/80 text-sm">Every Good Boy Deserves Fruit</div>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-3 ring-1 ring-blue-400/20">
              <div className="font-semibold text-blue-100 text-sm mb-1">Treble Spaces (FACE)</div>
              <div className="text-blue-200/80 text-sm">FACE spells FACE</div>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-3 ring-1 ring-blue-400/20">
              <div className="font-semibold text-blue-100 text-sm mb-1">Bass Lines (GBDFA)</div>
              <div className="text-blue-200/80 text-sm">Good Burritos Don't Fall Apart</div>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-3 ring-1 ring-blue-400/20">
              <div className="font-semibold text-blue-100 text-sm mb-1">Bass Spaces (ACEG)</div>
              <div className="text-blue-200/80 text-sm">All Cows Eat Grass</div>
            </div>
          </div>

          <div className="rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300 ring-1 ring-white/10">
            Weak notes are selected more often based on recent accuracy. Stats are stored locally in your browser.
          </div>
        </div>
      </div>
    </>
  );
}
