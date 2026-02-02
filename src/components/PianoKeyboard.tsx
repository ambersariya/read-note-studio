"use client";

import type { AccidentalPref, Note } from "../types";
import { useMemo, type CSSProperties, useEffect, useState } from "react";
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
  showKeyLabels: boolean;
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
  showKeyLabels,
}: PianoKeyboardProps) {
  // Detect desktop/tablet to decide how much context to show (keep mobile compact)
  const [isWide, setIsWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const pianoMidi = useMemo(() => {
    // On desktop/tablet, show an extra octave of context on each side (but not full 88 keys)
    const padding = isWide ? 16 : 0;
    let min = Math.max(0, minMidi - padding);
    while (isBlackKey(min) && min > 0) min--;
    let max = Math.min(127, maxMidi + padding);
    while (isBlackKey(max) && max < 127) max++;
    const out: number[] = [];
    for (let m = min; m <= max; m++) out.push(m);
    return out;
  }, [minMidi, maxMidi, isWide]);

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
    <div>
      {/* Piano Container - scrollable on mobile, fixed height */}
      <div className="relative overflow-x-auto overflow-y-hidden md:rounded-lg bg-transparent md:bg-zinc-900 md:p-2 md:border md:border-zinc-800 h-52 md:h-52">
        <div className="piano-keyboard relative flex pb-safe h-full min-w-full">
          {/* White keys */}
          <div className="flex flex-1">
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
                  title={showKeyLabels ? `${whiteKeyLabel(m, keySigPref, noteNaming)}${midiToOctave(m)}` : undefined}
                  className={
                    "white-key flex-1 relative h-full border-x border-b border-zinc-300 bg-zinc-50 text-zinc-900 " +
                    "hover:bg-white active:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed " +
                    (flashBad ? "key-flash-bad border-2 border-rose-400" : "")
                  }
                >
                  {showKeyLabels ? (
                    <div className="absolute bottom-2 left-0 right-0 text-center text-xs font-semibold">
                      {whiteKeyLabel(m, keySigPref, noteNaming)}
                    </div>
                  ) : null}
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
            const whiteKeyCount = whiteKeys.length;
            const leftPos = ((cssIndex + 1) / whiteKeyCount) * 100;
            
            return (
              <button
                key={midi}
                onClick={() => onKeyPress(midi)}
                disabled={!enabled}
                title={
                  showKeyLabels
                    ? `${noteLabelWithNaming({ midi, spelling: spellMidi(midi, keySigPref) }, noteNaming)}`
                    : undefined
                }
                className={
                  `black-key absolute top-3 h-32 rounded-b-md bg-zinc-950 text-zinc-100 ` +
                  `border border-black/30 hover:bg-zinc-900 active:bg-black disabled:opacity-30 disabled:cursor-not-allowed ` +
                  `pointer-events-auto z-10 ` +
                  (flashBad ? "key-flash-bad border-2 border-rose-400" : "")
                }
                style={
                  {
                    left: `calc(${leftPos}% - (var(--black-key-width) / 2))`,
                    "--black-key-width": "clamp(24px, 8%, 40px)",
                    width: "var(--black-key-width)",
                  } as CSSProperties
                }
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
