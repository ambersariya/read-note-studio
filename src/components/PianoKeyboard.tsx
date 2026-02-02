"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { AccidentalPref, Note } from "../types";
import { isBlackKey, midiToOctave, noteLabelWithNaming, spellMidi, whiteKeyLabel, type NoteNaming } from "../utils/noteUtils";
import { ensureAudioStarted, playThud } from "../utils/audio";

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
  const [blockedMidi, setBlockedMidi] = useState<number | null>(null);
  const [idleLevel, setIdleLevel] = useState<0 | 1 | 2>(0);
  const lastInteractionRef = useRef<number>(Date.now());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const registerInteraction = () => {
    lastInteractionRef.current = Date.now();
    setIdleLevel(0);
  };

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const idleFor = Date.now() - lastInteractionRef.current;
      if (idleFor >= 6000) setIdleLevel(2);
      else if (idleFor >= 3000) setIdleLevel(1);
      else setIdleLevel(0);
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => setContainerWidth(el.clientWidth || window.innerWidth);
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { pianoMidi, whiteKeyWidthPx, blackKeyWidthPx, keyboardWidthPx } = useMemo(() => {
    const TARGET_KEY = 48;
    const MIN_KEY = 40;
    const MAX_KEY = 60;
    const FALLBACK_WIDTH = 360; // reasonable default if ref not ready
    const width = containerWidth || FALLBACK_WIDTH;

    const baseKeyWidth = Math.min(MAX_KEY, Math.max(MIN_KEY, TARGET_KEY));
    const minOctaves = 2; // keep at least a two-octave anchor

    // Start with as many octaves as fit at target key width.
    let octaves = Math.max(minOctaves, Math.floor(width / (baseKeyWidth * 7)) || minOctaves);

    // Ensure we cover the active range; expand octaves if needed.
    const startC = Math.max(0, minMidi - (minMidi % 12));
    const neededOctaves = Math.ceil((maxMidi - startC + 1) / 12);
    if (neededOctaves > octaves) octaves = neededOctaves;

    // If required octaves overflow the container, allow a controlled shrink but never below MIN_KEY.
    let whiteKeyWidth = baseKeyWidth;
    const requiredWidth = octaves * 7 * whiteKeyWidth;
    if (requiredWidth > width) {
      const squeezed = width / (octaves * 7);
      whiteKeyWidth = Math.max(MIN_KEY, Math.min(MAX_KEY, squeezed));
    }

    const blackKeyWidth = whiteKeyWidth * 0.65;

    // Build MIDI list anchored on C
    let startMidi = startC;
    let endMidi = startMidi + octaves * 12 - 1;
    if (endMidi > 127) {
      const over = endMidi - 127;
      const shiftOctaves = Math.ceil(over / 12);
      startMidi = Math.max(0, startMidi - shiftOctaves * 12);
      endMidi = 127;
    }

    const out: number[] = [];
    for (let m = startMidi; m <= endMidi; m++) out.push(m);

    const totalWidth = whiteKeyWidth * out.filter((m) => !isBlackKey(m)).length;

    return {
      pianoMidi: out,
      whiteKeyWidthPx: whiteKeyWidth,
      blackKeyWidthPx: blackKeyWidth,
      keyboardWidthPx: totalWidth,
    };
  }, [containerWidth, minMidi, maxMidi]);

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

  // Center pivot prefers Middle C if within range; otherwise center of current answer set.
  const pivotMidi = useMemo(() => {
    if (midiChoices.includes(60)) return 60;
    return midiChoices[Math.floor(midiChoices.length / 2)] ?? 60;
  }, [midiChoices]);

  const pivotWhiteMidi = useMemo(() => {
    if (!whiteKeys.length) return pivotMidi;
    return whiteKeys.reduce((best, midi) => {
      const bestDiff = Math.abs(best - pivotMidi);
      const diff = Math.abs(midi - pivotMidi);
      return diff < bestDiff ? midi : best;
    }, whiteKeys[0]);
  }, [whiteKeys, pivotMidi]);

  // Use calculated widths directly; if the keyboard is wider than the container, offset to visually center.
  const renderedWhiteWidth = whiteKeyWidthPx;
  const renderedBlackWidth = blackKeyWidthPx;
  const renderedKeyboardWidth = keyboardWidthPx;

  const pivotIndex = whiteKeys.indexOf(pivotWhiteMidi);
  const pivotX = pivotIndex >= 0
    ? pivotIndex * renderedWhiteWidth + renderedWhiteWidth / 2
    : renderedKeyboardWidth / 2;
  const targetCenter = containerWidth / 2;
  const desiredShift = pivotX - targetCenter;
  const maxShift = Math.max(renderedKeyboardWidth - containerWidth, 0);
  const clampedShift = Math.min(Math.max(desiredShift, 0), maxShift);
  const overflowOffset = clampedShift > 0 ? clampedShift : 0;

  const activeStartIndex = useMemo(
    () => whiteKeys.findIndex((m) => m >= minMidi),
    [whiteKeys, minMidi]
  );
  const activeEndIndex = useMemo(() => {
    for (let i = whiteKeys.length - 1; i >= 0; i--) {
      if (whiteKeys[i] <= maxMidi) return i;
    }
    return -1;
  }, [whiteKeys, maxMidi]);
  const activeOverlay =
    activeStartIndex >= 0 && activeEndIndex >= activeStartIndex
      ? {
          left: activeStartIndex * renderedWhiteWidth,
          width: (activeEndIndex - activeStartIndex + 1) * renderedWhiteWidth,
        }
      : null;

  const isInAnswerSet = (midi: number): boolean => midiChoices.includes(midi);

  const whiteButtonClass =
    "white-key flex-1 relative h-full border-x border-b border-zinc-300 bg-zinc-50 text-zinc-900 " +
    "hover:bg-white active:bg-zinc-100 touch-manipulation " +
    "rounded-b-lg overflow-visible";

  const blackButtonBaseClass =
    "black-key absolute top-3 h-44 rounded-b-md bg-black text-zinc-100 border border-zinc-800 " +
    "hover:bg-zinc-900 active:bg-black disabled:opacity-40 disabled:bg-black disabled:text-zinc-300 " +
    "disabled:border-zinc-800/80 disabled:cursor-not-allowed pointer-events-auto z-10 touch-manipulation";

  const labelOpacity = showKeyLabels ? (idleLevel === 2 ? 1 : idleLevel === 1 ? 0.45 : 0.85) : 0;

  const handlePress = async (midi: number, enabled: boolean) => {
    registerInteraction();
    if (!enabled) {
      setBlockedMidi(midi);
      window.setTimeout(() => setBlockedMidi((prev) => (prev === midi ? null : prev)), 220);
      await ensureAudioStarted();
      playThud();
      return;
    }
    onKeyPress(midi);
  };

  const renderWhiteKey = (midi: number) => {
    const enabled = isInAnswerSet(midi);
    const flashBad = flashState === "bad" && flashMidi === midi;
    const label = whiteKeyLabel(midi, keySigPref, noteNaming);
    const showMiddleC = midi === 60;
    const isBlocked = blockedMidi === midi;

    const keyAriaLabel = showKeyLabels ? `${label}${midiToOctave(midi)}` : midi === 60 ? "Middle C anchor" : "Piano key";
    return (
      <button
        key={midi}
        type="button"
        onClick={() => void handlePress(midi, enabled)}
        aria-pressed={midi === currentNote.midi}
        aria-label={keyAriaLabel}
        title={showKeyLabels ? keyAriaLabel : undefined}
        aria-disabled={!enabled}
        tabIndex={enabled ? 0 : -1}
        className={`${whiteButtonClass} ${flashBad ? "key-flash-bad border-2 border-rose-400" : ""} ${
          !enabled ? "opacity-35 filter saturate-50 cursor-not-allowed" : ""
        } ${isBlocked ? "animate-shake-soft ring-1 ring-zinc-500/40" : ""}`}
      >
        {showKeyLabels ? (
          <div
            className="absolute bottom-2 left-0 right-0 text-center text-xs font-semibold text-zinc-900"
            aria-hidden
            style={{ opacity: labelOpacity, transition: "opacity 240ms ease" }}
          >
            {label}
          </div>
        ) : null}
        {showMiddleC ? (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-emerald-500/70 shadow-sm shadow-emerald-400/40" aria-hidden />
        ) : null}
      </button>
    );
  };

  const renderBlackKey = (midi: number, cssIndex: number) => {
    const enabled = includeAccidentals && isInAnswerSet(midi);
    const flashBad = flashState === "bad" && flashMidi === midi;
    const label = noteLabelWithNaming({ midi, spelling: spellMidi(midi, keySigPref) }, noteNaming);
    const isBlocked = blockedMidi === midi;

    const keyAriaLabel = showKeyLabels ? label : midi === 60 ? "Middle C anchor" : "Black piano key";
    return (
      <button
        key={midi}
        type="button"
        onClick={() => void handlePress(midi, enabled)}
        aria-pressed={midi === currentNote.midi}
        aria-label={keyAriaLabel}
        title={showKeyLabels ? label : undefined}
        aria-disabled={!enabled}
        tabIndex={enabled ? 0 : -1}
        className={`${blackButtonBaseClass} ${flashBad ? "key-flash-bad border-2 border-rose-400" : ""} ${
          !enabled ? "opacity-45 filter saturate-50 cursor-not-allowed" : ""
        } ${isBlocked ? "animate-shake-soft ring-1 ring-zinc-500/40" : ""}`}
        style={
          {
            left: `${(cssIndex + 1) * renderedWhiteWidth - renderedBlackWidth / 2}px`,
            width: `${renderedBlackWidth}px`,
            "--black-key-width": `${renderedBlackWidth}px`,
          } as CSSProperties
        }
      >
        {showKeyLabels ? (
          <div
            className="absolute -bottom-1 left-0 right-0 text-center text-[10px] font-semibold text-white"
            aria-hidden
            style={{ opacity: labelOpacity, transition: "opacity 240ms ease" }}
          >
            {label}
          </div>
        ) : null}
      </button>
    );
  };

  return (
    <section className="h-full select-none" aria-label="Piano keyboard">
      <div
        ref={containerRef}
        className="relative overflow-hidden md:rounded-lg bg-transparent md:bg-zinc-900 md:p-3 md:border md:border-zinc-800 h-full max-h-[340px] min-h-[260px] sm:min-h-[240px] md:min-h-[220px]"
      >
        <div
          className="piano-keyboard relative h-full flex flex-col mx-auto"
          style={
            {
              width: `${renderedKeyboardWidth}px`,
              marginLeft: overflowOffset ? `-${overflowOffset}px` : undefined,
              "--white-key-width": `${renderedWhiteWidth}px`,
              "--black-key-width": `${renderedBlackWidth}px`,
            } as CSSProperties
          }
        >
          <div className="h-2 bg-rose-500/90 rounded-t-sm shrink-0" aria-hidden />
          <div className="relative flex pb-safe flex-1 justify-center" role="group" aria-label="Piano keys">
            {activeOverlay ? (
              <div
                className="absolute inset-y-0 rounded-md pointer-events-none bg-emerald-200/12 border border-emerald-400/25"
                style={{ left: `${activeOverlay.left}px`, width: `${activeOverlay.width}px` }}
                aria-hidden
              />
            ) : null}
            <div className="flex">{whiteKeys.map(renderWhiteKey)}</div>
            {blackKeys.map(({ midi, cssIndex }) => renderBlackKey(midi, cssIndex))}
          </div>
        </div>
      </div>
    </section>
  );
}
