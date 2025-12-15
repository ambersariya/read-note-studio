import type { AccidentalPref, Note } from "../types";
import { useMemo } from "react";
import { isBlackKey, whiteKeyLabel, midiToOctave, noteLabel, spellMidi } from "../utils/noteUtils";

interface PianoKeyboardProps {
  minMidi: number;
  maxMidi: number;
  currentNote: Note;
  includeAccidentals: boolean;
  midiChoices: number[];
  keySigPref: AccidentalPref;
  showHints: boolean;
  onKeyPress: (midi: number) => void;
}

export function PianoKeyboard({
  minMidi,
  maxMidi,
  currentNote,
  includeAccidentals,
  midiChoices,
  keySigPref,
  showHints,
  onKeyPress,
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
    // For each black key, compute its position index between white keys.
    const whites = whiteKeys;
    const positions: { midi: number; leftIndex: number }[] = [];
    for (const m of pianoMidi) {
      if (!isBlackKey(m)) continue;
      // Find the nearest white key below
      let below = m - 1;
      while (below >= 0 && isBlackKey(below)) below--;
      const leftIndex = Math.max(0, whites.indexOf(below));
      positions.push({ midi: m, leftIndex });
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
        <div className="relative inline-flex">
          {/* White keys */}
          <div className="inline-flex">
            {whiteKeys.map((m) => {
              const active = m === currentNote.midi;
              const enabled = isInAnswerSet(m);
              return (
                <button
                  key={m}
                  onClick={() => onKeyPress(m)}
                  disabled={!enabled}
                  title={`${whiteKeyLabel(m, keySigPref)}${midiToOctave(m)}`}
                  className={
                    "relative h-36 w-12 border border-slate-300/40 bg-slate-50 text-slate-900 " +
                    "hover:bg-white active:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  }
                >
                  <div className="absolute bottom-2 left-0 right-0 text-center text-xs font-semibold">
                    {whiteKeyLabel(m, keySigPref)}
                  </div>
                  {active && showHints ? <div className="absolute inset-x-1 top-1 h-2 rounded bg-emerald-500/60" /> : null}
                </button>
              );
            })}
          </div>

          {/* Black keys */}
          {blackKeys.map(({ midi, leftIndex }) => {
            const active = midi === currentNote.midi;
            const enabled = includeAccidentals && isInAnswerSet(midi);
            // Position black key between white keys
            const leftPx = leftIndex * 48 + 34; // 48=white key width (w-12), 34 centers black key
            return (
              <button
                key={midi}
                onClick={() => onKeyPress(midi)}
                disabled={!enabled}
                title={`${noteLabel({ midi, spelling: spellMidi(midi, keySigPref) })}`}
                style={{ left: `${leftPx}px` }}
                className={
                  "absolute top-3 h-24 w-8 rounded-b-lg bg-slate-950 text-slate-100 ring-1 ring-black/30 " +
                  "hover:bg-slate-900 active:bg-black disabled:opacity-30 disabled:cursor-not-allowed"
                }
              >
                {active && showHints ? <div className="mx-auto mt-2 h-2 w-6 rounded bg-emerald-400/70" /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
