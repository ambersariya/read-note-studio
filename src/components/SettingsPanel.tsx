import type { Clef, KeySig, RangePreset, Note } from "../types";
import { KEY_SIGS, RANGES } from "../utils/constants";
import { noteLabel, spellMidi } from "../utils/noteUtils";

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

interface SettingsPanelProps {
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
  inDrawer?: boolean;
}

export function SettingsPanel({
  rangeId,
  clef,
  keySigId,
  difficulty,
  showHints,
  currentNote,
  range,
  keySig,
  onRangeChange,
  onClefChange,
  onKeySigChange,
  onDifficultyChange,
  onShowHintsChange,
  noteNaming,
  onNoteNamingChange,
  autoAdvance,
  onAutoAdvanceChange,
  visualHint,
  onVisualHintChange,
  inDrawer = false,
}: SettingsPanelProps) {
  const containerClass = inDrawer
    ? "px-4"
    : "lg:sticky lg:top-5 flex flex-col rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10 sm:p-5 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-hidden";

  return (
    <aside className={containerClass}>
      {!inDrawer && <h2 className="text-base font-semibold">Settings</h2>}

      <div className={`${inDrawer ? '' : 'mt-4'} flex-1 space-y-3 ${inDrawer ? '' : 'overflow-y-auto pr-1 no-scrollbar lg:pr-2'}`}>
        {/* Clef - Moved to top */}
        <div className="block">
          <div className="mb-2 text-sm font-semibold text-slate-200">Clef</div>
          <div className="flex gap-2">
            <button
              onClick={() => onClefChange("treble")}
              className={
                "flex-1 rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-white/10 transition " +
                (clef === "treble" ? "bg-white/15" : "bg-white/5 hover:bg-white/10")
              }
            >
              Treble
            </button>
            <button
              onClick={() => onClefChange("bass")}
              className={
                "flex-1 rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-white/10 transition " +
                (clef === "bass" ? "bg-white/15" : "bg-white/5 hover:bg-white/10")
              }
            >
              Bass
            </button>
          </div>
        </div>

        {/* Level/Range - Compact dropdown style */}
        <div className="block">
          <div className="mb-2 text-sm font-semibold text-slate-200">Level / Range</div>
          <select
            value={rangeId}
            onChange={(e) => onRangeChange(e.target.value)}
            className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10 transition cursor-pointer"
          >
            {RANGES.map((r) => (
              <option key={r.id} value={r.id} className="bg-slate-900 text-slate-200">
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Level - Compact segmented control */}
        <div className="block">
          <div className="mb-2 text-sm font-semibold text-slate-200">Difficulty</div>
          <div className="flex gap-2">
            <button
              onClick={() => onDifficultyChange("beginner")}
              className={
                "flex-1 rounded-xl px-2 py-2 text-xs font-semibold ring-1 ring-white/10 transition " +
                (difficulty === "beginner" ? "bg-white/15" : "bg-white/5 hover:bg-white/10")
              }
            >
              Beginner
            </button>
            <button
              onClick={() => onDifficultyChange("intermediate")}
              className={
                "flex-1 rounded-xl px-2 py-2 text-xs font-semibold ring-1 ring-white/10 transition " +
                (difficulty === "intermediate" ? "bg-white/15" : "bg-white/5 hover:bg-white/10")
              }
            >
              Inter
            </button>
            <button
              onClick={() => onDifficultyChange("advanced")}
              className={
                "flex-1 rounded-xl px-2 py-2 text-xs font-semibold ring-1 ring-white/10 transition " +
                (difficulty === "advanced" ? "bg-white/15" : "bg-white/5 hover:bg-white/10")
              }
            >
              Advanced
            </button>
          </div>
        </div>

        {/* Assistance Section */}
        <div className="block rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
          <div className="mb-3 text-sm font-semibold text-slate-200">Assistance</div>

          <label className="flex items-center justify-between gap-3 mb-2">
            <div className="text-sm text-slate-200">Show Hints</div>
            <input
              type="checkbox"
              checked={showHints}
              onChange={(e) => onShowHintsChange(e.target.checked)}
              className="h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between gap-3 mb-2">
            <div className="text-sm text-slate-200">Auto-Advance</div>
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => onAutoAdvanceChange(e.target.checked)}
              className="h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-200">Idle Help (5s)</div>
            <input
              type="checkbox"
              checked={visualHint}
              onChange={(e) => onVisualHintChange(e.target.checked)}
              className="h-4 w-4"
            />
          </label>
        </div>

        {/* Notation - Renamed from "Note naming" */}
        <div className="block">
          <div className="mb-2 text-sm font-semibold text-slate-200">Notation</div>
          <select
            value={noteNaming}
            onChange={(e) => onNoteNamingChange(e.target.value as SettingsPanelProps["noteNaming"])}
            className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 hover:bg-white/10 transition cursor-pointer"
          >
            <option value="english" className="bg-slate-900">Scientific (C, D, E)</option>
            <option value="solfege" className="bg-slate-900">Solfège (Do, Re, Mi)</option>
            <option value="german" className="bg-slate-900">German (H for B)</option>
          </select>
        </div>

        {/* Key Signature - Compact */}
        <details className="group rounded-xl bg-slate-800/60 px-3 py-3 ring-1 ring-white/10">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-200">
            Key Signature
            <span className="text-xs text-slate-400">▼</span>
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {KEY_SIGS.map((k) => (
              <button
                key={k.id}
                onClick={() => onKeySigChange(k.id)}
                className={
                  "rounded-xl px-3 py-2 text-left text-sm font-semibold ring-1 ring-white/10 transition " +
                  (keySigId === k.id ? "bg-white/15 text-white" : "bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                {k.label}
              </button>
            ))}
          </div>
        </details>

      </div>

      {!inDrawer && (
        <div className="mt-4 rounded-xl bg-slate-800/50 p-3 text-xs text-slate-300 ring-1 ring-white/10">
          <div className="font-semibold text-slate-200">Current Exercise</div>
          <div className="mt-1">{noteLabel(currentNote)}</div>
          <div className="mt-2 text-slate-400">
            Range:{" "}
            {noteLabel({ midi: range.minMidi, spelling: spellMidi(range.minMidi, keySig.pref) })}–{noteLabel({
              midi: range.maxMidi,
              spelling: spellMidi(range.maxMidi, keySig.pref),
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
