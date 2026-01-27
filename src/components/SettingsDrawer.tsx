import { useState } from "react";
import { createPortal } from "react-dom";
import { SettingsPanel } from "./SettingsPanel";
import type { Clef, KeySig, Note, RangePreset } from "../types";

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

interface SettingsDrawerProps {
  rangeId: string;
  clef: Clef;
  keySigId: string;
  difficulty: DifficultyLevel;
  showHints: boolean;
  currentNote: Note;
  range: RangePreset;
  keySig: KeySig;
  onRangeChange: (rangeId: string) => void;
  onClefChange: (clef: Clef) => void;
  onKeySigChange: (keySigId: string) => void;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  onShowHintsChange: (show: boolean) => void;
  noteNaming: "english" | "solfege" | "german";
  onNoteNamingChange: (n: "english" | "solfege" | "german") => void;
  autoAdvance: boolean;
  onAutoAdvanceChange: (v: boolean) => void;
  visualHint: boolean;
  onVisualHintChange: (v: boolean) => void;
}

export function SettingsDrawer(props: SettingsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Settings Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
        title="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Modal Portal - Renders at document root */}
      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Slide-over Panel */}
          <div className="fixed inset-y-0 right-0 w-full sm:w-96 z-50 animate-slide-in-right">
            <div className="h-full flex flex-col bg-slate-900 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-slate-100">Settings</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-white/5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Settings Content */}
              <div className="flex-1 overflow-y-auto">
                <SettingsPanel {...props} inDrawer />
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
