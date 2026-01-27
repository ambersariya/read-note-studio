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
}: SettingsPanelProps) {
  return (
    <aside className="lg:sticky lg:top-5 flex flex-col rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10 sm:p-5 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-hidden">
      <h2 className="text-base font-semibold">Settings</h2>

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1 no-scrollbar lg:pr-2">
        <div className="block rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
          <div className="mb-2 text-sm font-semibold text-slate-200">Difficulty Level</div>
          <div className="flex gap-2">
            <button
              onClick={() => onDifficultyChange("beginner")}
              className={
                "flex-1 rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-white/10 " +
                (difficulty === "beginner" ? "bg-white/15" : "bg-white/5 hover:bg-white/10")
              }
            >
              🌱 Beginner
            </button>
            <button
              onClick={() => onDifficultyChange("intermediate")}
              className={
                "flex-1 rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-white/10 " +
                (difficulty === "intermediate" ? "bg-white/15" : "bg-white/5 hover:bg-white/10")
              }
            >
              📚 Intermediate
            </button>
            <button
              onClick={() => onDifficultyChange("advanced")}
              className={
                "flex-1 rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-white/10 " +
                (difficulty === "advanced" ? "bg-white/15" : "bg-white/5 hover:bg-white/10")
              }
            >
              🎓 Advanced
            </button>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {difficulty === "beginner" && "Perfect for starting out! No sharps or flats."}
            {difficulty === "intermediate" && "Includes sharps and flats for extra challenge."}
            {difficulty === "advanced" && "Full chromatic range with all accidentals."}
          </div>
        </div>

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

        <div className="block">
          <div className="mb-1 text-sm font-semibold text-slate-200">Range preset</div>
          <div className="grid grid-cols-2 gap-2">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => onRangeChange(r.id)}
                className={
                  "rounded-xl px-3 py-2 text-left text-sm font-semibold ring-1 ring-white/10 " +
                  (rangeId === r.id ? "bg-white/15 text-white" : "bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

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

        <details className="group rounded-xl bg-slate-800/60 px-3 py-3 ring-1 ring-white/10">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-200">
            Key signature
            <span className="text-xs text-slate-400 group-open:hidden">Tap to choose</span>
            <span className="text-xs text-slate-400 hidden group-open:inline">Tap to close</span>
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {KEY_SIGS.map((k) => (
              <button
                key={k.id}
                onClick={() => onKeySigChange(k.id)}
                className={
                  "rounded-xl px-3 py-2 text-left text-sm font-semibold ring-1 ring-white/10 " +
                  (keySigId === k.id ? "bg-white/15 text-white" : "bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                {k.label}
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Notes are spelled with {keySig.pref === "flats" ? "flats" : "sharps"} by default for this key.
          </div>
        </details>

      </div>

      <div className="mt-4 rounded-xl bg-slate-800/50 p-3 text-xs text-slate-300 ring-1 ring-white/10">
        <div className="font-semibold text-slate-200">Current note</div>
        <div className="mt-1">{noteLabel(currentNote)}</div>
        <div className="mt-2 text-slate-400">
          Range:{" "}
          {noteLabel({ midi: range.minMidi, spelling: spellMidi(range.minMidi, keySig.pref) })}–{noteLabel({
            midi: range.maxMidi,
            spelling: spellMidi(range.maxMidi, keySig.pref),
          })}
        </div>
      </div>
    </aside>
  );
}
