import type { AccidentalPref, Note } from "../types";
import { useMemo, type CSSProperties } from "react";
import { isBlackKey, whiteKeyLabel, midiToOctave, noteLabelWithNaming, spellMidi, type NoteNaming } from "../utils/noteUtils";

interface PianoKeyboardProps {
  minMidi: number;
  maxMidi: number;
  currentNote: Note;
  includeAccidentals: boolean;
  midiChoices: number[];
  keySigPref: AccidentalPref;
  showHints: boolean;
  onKeyPress: (midi: number) => void;
  flashMidi?: number | null;
  flashState?: "neutral" | "good" | "bad";
  noteNaming: NoteNaming;
  hintForced?: boolean;
}

export function PianoKeyboard({
  minMidi,
  maxMidi,
  currentNote,
  includeAccidentals,
  midiChoices,
  keySigPref,
  showHints,
  noteNaming,
  onKeyPress,
  flashMidi = null,
  flashState = "neutral",
  hintForced = false,
}: PianoKeyboardProps) {
  const pianoMidi = useMemo(() => {
    // Expand a little to start/end on white keys for nicer layout
    let min = minMidi;
    while (isBlackKey(min) && min > 0) min--;
    let max = maxMidi;
    while (isBlackKey(max) && max < 127) max++;
    const out: number[] = [];
    for (let m = min; m <= max; m++) out.push(m);
    return out;
  }, [minMidi, maxMidi]);

  const whiteKeys = useMemo(() => pianoMidi.filter((m) => !isBlackKey(m)), [pianoMidi]);

  const blackKeys = useMemo(() => {
    // For each black key, compute its CSS class index based on white key position
    const whites = whiteKeys;
    const positions: { midi: number; cssIndex: number }[] = [];
    for (const m of pianoMidi) {
      if (!isBlackKey(m)) continue;
      
      // Find the white key immediately below this black key
      let below = m - 1;
      while (below >= 0 && isBlackKey(below)) below--;
      
      const whiteKeyIndex = whites.indexOf(below);
      if (whiteKeyIndex === -1) continue; // Skip if white key not found
      
      // The black key sits between this white key and the next one
      // So the CSS position is based on the white key index
      // C# (pc=1) comes after C (index of C)
      // D# (pc=3) comes after D (index of D)
      // F# (pc=6) comes after F (index of F)
      // etc.
      positions.push({ midi: m, cssIndex: whiteKeyIndex });
    }
    return positions;
  }, [pianoMidi, whiteKeys]);

  const isInAnswerSet = (midi: number): boolean => midiChoices.includes(midi);

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">On-screen piano</h2>
        <div className="text-xs text-slate-400">Click a key to answer</div>
      </div>

      <div className="relative overflow-x-auto rounded-xl bg-slate-800/40 p-3 ring-1 ring-white/10">
        <div className="piano-keyboard relative inline-flex">
          {/* White keys */}
          <div className="inline-flex">
            {whiteKeys.map((m) => {
              const active = m === currentNote.midi;
              const enabled = isInAnswerSet(m);
              const flashBad = flashState === "bad" && flashMidi === m;
              const showHighlight = active && (showHints || hintForced);
              return (
                <button
                  key={m}
                  onClick={() => onKeyPress(m)}
                  disabled={!enabled}
                  title={`${whiteKeyLabel(m, keySigPref, noteNaming)}${midiToOctave(m)}`}
                  className={
                    "white-key relative h-32 border border-slate-300/40 bg-slate-50 text-slate-900 rounded-b " +
                    "hover:bg-white active:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed " +
                    "sm:h-44 " +
                    (flashBad ? "key-flash-bad ring-2 ring-rose-400/80" : "")
                  }
                >
                  <div className="absolute bottom-2 left-0 right-0 text-center text-xs font-semibold">
                    {whiteKeyLabel(m, keySigPref, noteNaming)}
                  </div>
                  {showHighlight ? <div className="absolute inset-x-1 top-1 h-3 rounded bg-emerald-500/60" /> : null}
                </button>
              );
            })}
          </div>

          {/* Black keys */}
          {blackKeys.map(({ midi, cssIndex }) => {
            const active = midi === currentNote.midi;
            const enabled = includeAccidentals && isInAnswerSet(midi);
            const flashBad = flashState === "bad" && flashMidi === midi;
            const showHighlight = active && (showHints || hintForced);
            
            return (
              <button
                key={midi}
                onClick={() => onKeyPress(midi)}
                disabled={!enabled}
                title={`${noteLabelWithNaming({ midi, spelling: spellMidi(midi, keySigPref) }, noteNaming)}`}
                className={
                  `black-key absolute top-3 h-24 rounded-b-lg bg-slate-950 text-slate-100 ring-1 ring-black/30 ` +
                  `hover:bg-slate-900 active:bg-black disabled:opacity-30 disabled:cursor-not-allowed ` +
                  `sm:h-32 ` +
                  (flashBad ? "key-flash-bad ring-2 ring-rose-400/80" : "")
                }
                style={{ "--key-index": cssIndex } as CSSProperties}
              >
                {showHighlight ? <div className="mx-auto mt-2 h-2 w-5 rounded bg-emerald-400/70 sm:w-7" /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
