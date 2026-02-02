"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { AccidentalPref, Note } from "../types";
import { isBlackKey, midiToOctave, noteLabelWithNaming, spellMidi, whiteKeyLabel, type NoteNaming } from "../utils/noteUtils";

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
  const [isWide, setIsWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const pianoMidi = useMemo(() => {
    // Add a little context on wide screens (roughly an octave either side).
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
    const positions: { midi: number; cssIndex: number }[] = [];

    for (const midi of pianoMidi) {
      if (!isBlackKey(midi)) continue;

      let below = midi - 1;
      while (below >= 0 && isBlackKey(below)) below--;

      const whiteKeyIndex = whiteKeys.indexOf(below);
      if (whiteKeyIndex === -1) continue;

      positions.push({ midi, cssIndex: whiteKeyIndex });
    }

    return positions;
  }, [pianoMidi, whiteKeys]);

  const isInAnswerSet = (midi: number): boolean => midiChoices.includes(midi);

  const whiteButtonClass =
    "white-key flex-1 relative h-full border-x border-b border-zinc-300 bg-zinc-50 text-zinc-900 " +
    "hover:bg-white active:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation " +
    "rounded-b-lg overflow-hidden";

  const blackButtonBaseClass =
    "black-key absolute top-3 h-44 rounded-b-md bg-black text-zinc-100 border border-zinc-800 " +
    "hover:bg-zinc-900 active:bg-black disabled:opacity-40 disabled:bg-black disabled:text-zinc-300 " +
    "disabled:border-zinc-800/80 disabled:cursor-not-allowed pointer-events-auto z-10 touch-manipulation";

  const renderWhiteKey = (midi: number) => {
    const active = midi === currentNote.midi;
    const enabled = isInAnswerSet(midi);
    const flashBad = flashState === "bad" && flashMidi === midi;
    const showHighlight = active && (showHints || hintForced);
    const label = whiteKeyLabel(midi, keySigPref, noteNaming);

    return (
      <button
        key={midi}
        type="button"
        onClick={() => onKeyPress(midi)}
        disabled={!enabled}
        aria-pressed={active}
        aria-label={`${label}${midiToOctave(midi)}`}
        title={showKeyLabels ? `${label}${midiToOctave(midi)}` : undefined}
        className={`${whiteButtonClass} ${flashBad ? "key-flash-bad border-2 border-rose-400" : ""}`}
      >
        {showKeyLabels ? (
          <div className="absolute bottom-2 left-0 right-0 text-center text-xs font-semibold" aria-hidden>
            {label}
          </div>
        ) : null}
        {showHighlight ? <div className="absolute inset-x-1 top-1 h-3 rounded bg-emerald-500/60" aria-hidden /> : null}
      </button>
    );
  };

  const renderBlackKey = (midi: number, cssIndex: number) => {
    const active = midi === currentNote.midi;
    const enabled = includeAccidentals && isInAnswerSet(midi);
    const flashBad = flashState === "bad" && flashMidi === midi;
    const showHighlight = active && (showHints || hintForced);
    const leftPos = ((cssIndex + 1) / whiteKeys.length) * 100;
    const label = noteLabelWithNaming({ midi, spelling: spellMidi(midi, keySigPref) }, noteNaming);

    return (
      <button
        key={midi}
        type="button"
        onClick={() => onKeyPress(midi)}
        disabled={!enabled}
        aria-pressed={active}
        aria-label={label}
        title={showKeyLabels ? label : undefined}
        className={`${blackButtonBaseClass} ${flashBad ? "key-flash-bad border-2 border-rose-400" : ""}`}
        style={
          {
            left: `calc(${leftPos}% - (var(--black-key-width) / 2))`,
            "--black-key-width": "clamp(17px, 5.5%, 30px)",
            width: "var(--black-key-width)",
          } as CSSProperties
        }
      >
        {showHighlight ? <div className="mx-auto mt-2 h-2 w-5 rounded bg-emerald-400/70 sm:w-7" aria-hidden /> : null}
      </button>
    );
  };

  return (
    <section className="h-full select-none" aria-label="Piano keyboard">
      <div className="relative overflow-x-auto overflow-y-hidden md:rounded-lg bg-transparent md:bg-zinc-900 md:p-3 md:border md:border-zinc-800 h-full max-h-[320px] min-h-[220px]">
        <div className="piano-keyboard relative h-full min-w-full flex flex-col">
          <div className="h-2 bg-rose-500/90 rounded-t-sm shrink-0" aria-hidden />
          <div className="relative flex pb-safe flex-1" role="group" aria-label="Piano keys">
            <div className="flex flex-1">{whiteKeys.map(renderWhiteKey)}</div>
            {blackKeys.map(({ midi, cssIndex }) => renderBlackKey(midi, cssIndex))}
          </div>
        </div>
      </div>
    </section>
  );
}
