import type { Clef, KeySig, RangePreset, Note } from "../types";
import { KEY_SIGS, RANGES } from "../utils/constants";
import { noteLabel } from "../utils/noteUtils";

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
  onResetStats: () => void;
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
  onResetStats,
}: SettingsPanelProps) {
  return (
    <aside className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-white/10">
      <h2 className="text-base font-semibold">Settings</h2>

      <div className="mt-4 space-y-4">
        <label className="block">
          <div className="mb-1 text-sm font-semibold text-slate-200">Difficulty Level</div>
          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as DifficultyLevel)}
            className="w-full rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-100 ring-1 ring-white/10 focus:outline-none"
          >
            <option value="beginner">🌱 Beginner (natural notes only)</option>
            <option value="intermediate">📚 Intermediate (with accidentals)</option>
            <option value="advanced">🎓 Advanced (full range)</option>
          </select>
          <div className="mt-2 text-xs text-slate-400">
            {difficulty === "beginner" && "Perfect for starting out! No sharps or flats."}
            {difficulty === "intermediate" && "Includes sharps and flats for extra challenge."}
            {difficulty === "advanced" && "Full chromatic range with all accidentals."}
          </div>
        </label>

        <label className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
          <div>
            <div className="text-sm font-semibold text-slate-200">Show note hints</div>
            <div className="text-xs text-slate-400">Highlight the current note on the piano keyboard</div>
          </div>
          <input
            type="checkbox"
            checked={showHints}
            onChange={(e) => onShowHintsChange(e.target.checked)}
            className="h-5 w-5"
          />
        </label>

        <label className="block">
          <div className="mb-1 text-sm font-semibold text-slate-200">Range preset</div>
          <select
            value={rangeId}
            onChange={(e) => onRangeChange(e.target.value)}
            className="w-full rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-100 ring-1 ring-white/10 focus:outline-none"
          >
            {RANGES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="mb-1 text-sm font-semibold text-slate-200">Clef</div>
          <div className="flex gap-2">
            <button
              onClick={() => onClefChange("treble")}
              className={
                "flex-1 rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-white/10 " +
                (clef === "treble" ? "bg-white/15" : "bg-white/5 hover:bg-white/10")
              }
            >
              Treble
            </button>
            <button
              onClick={() => onClefChange("bass")}
              className={
                "flex-1 rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-white/10 " +
                (clef === "bass" ? "bg-white/15" : "bg-white/5 hover:bg-white/10")
              }
            >
              Bass
            </button>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Tip: range presets automatically set a sensible clef, but you can override it.
          </div>
        </label>

        <label className="block">
          <div className="mb-1 text-sm font-semibold text-slate-200">Key signature</div>
          <select
            value={keySigId}
            onChange={(e) => onKeySigChange(e.target.value)}
            className="w-full rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-100 ring-1 ring-white/10 focus:outline-none"
          >
            {KEY_SIGS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
          <div className="mt-2 text-xs text-slate-400">
            Notes are spelled with {keySig.pref === "flats" ? "flats" : "sharps"} by default for this key.
          </div>
        </label>

        <div className="rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
          <div className="text-sm font-semibold text-slate-200">Spaced repetition</div>
          <div className="mt-1 text-xs text-slate-400">
            Weak notes are picked more often based on your recent accuracy. Stats are stored locally in your browser.
          </div>

          <button
            onClick={onResetStats}
            className="mt-3 w-full rounded-xl bg-rose-500/20 px-3 py-2 text-sm font-semibold text-rose-100 ring-1 ring-rose-400/30 hover:bg-rose-500/30"
          >
            Reset stats
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-slate-800/50 p-3 text-xs text-slate-300 ring-1 ring-white/10">
        <div className="font-semibold text-slate-200">Current card</div>
        <div className="mt-1">{noteLabel(currentNote)}</div>
        <div className="mt-2 text-slate-400">
          Range: {range.minMidi}–{range.maxMidi} (MIDI)
        </div>
      </div>
    </aside>
  );
}
