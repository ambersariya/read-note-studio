import type { Clef, KeySig, Note } from "../types";
import { useRef, useEffect, useCallback } from "react";
import Flow from "vexflow";
import { vexKeyForNote } from "../utils/noteUtils";

const STROKE = "#0f172a"; // dark stroke for visibility on light panel

interface StaveDisplayProps {
  note: Note;
  clef: Clef;
  keySig: KeySig;
  flashState?: "neutral" | "good" | "bad";
  playedMidi?: number | null;
}

export function StaveDisplay({ note, clef, keySig, flashState = "neutral", playedMidi = null }: StaveDisplayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const renderStave = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    el.innerHTML = "";

    const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = Flow;

    // Dynamically calculate dimensions based on container
    const containerWidth = el.clientWidth;

    // Calculate scale based on container width
    const scale = Math.max(Math.min(containerWidth / 300, 3.5), 1.5);

    const drawWidth = containerWidth / scale;
    // Staff only needs ~140px of height (includes clef, key sig, note, and margins)
    const baseStaveHeight = 140;
    const staveWidth = drawWidth - 40;
    const staveY = 20; // Small top margin

    const renderer = new Renderer(el, Renderer.Backends.SVG);
    // SVG height is just what the staff needs, not the full container
    renderer.resize(containerWidth, baseStaveHeight * scale);
    const context = renderer.getContext();
    context.scale(scale, scale);
    context.setFillStyle(STROKE);
    context.setStrokeStyle(STROKE);

    const stave = new Stave(20, staveY, staveWidth);
    stave.addClef(clef);
    stave.addKeySignature(keySig.vex);
    stave.setContext(context).draw();

    const keys = [vexKeyForNote(note)];
    const staveNote = new StaveNote({
      clef,
      keys,
      duration: "q",
    }).setStyle({ strokeStyle: STROKE, fillStyle: STROKE });

    // If our key string includes an accidental, add it explicitly so it's always shown.
    if (note.spelling.accidental === "#" || note.spelling.accidental === "b") {
      staveNote.addModifier(new Accidental(note.spelling.accidental));
    }

    const tickables = [staveNote];

    // Display ghost note (the wrong note played) in red to show error distance
    if (playedMidi !== null && playedMidi !== note.midi) {
      const wrongSpelling = { midi: playedMidi, spelling: { ...note.spelling } };

      // Simple ghost note - just show at the played MIDI position
      const wrongKey = vexKeyForNote(wrongSpelling);
      const wrongNote = new StaveNote({
        clef,
        keys: [wrongKey],
        duration: "q",
      }).setStyle({
        strokeStyle: "rgba(248,113,113,0.7)",
        fillStyle: "rgba(248,113,113,0.35)",
      });
      tickables.push(wrongNote);
    }

    const voice = new Voice({ numBeats: 1, beatValue: 4 });
    // Exercises are measure-free: allow incomplete measures.
    voice.setMode(Flow.Voice.Mode.SOFT);
    voice.addTickables(tickables);

    new Formatter().joinVoices([voice]).format([voice], 240);
    voice.draw(context, stave);
  }, [note, clef, keySig, playedMidi]);

  // Render on mount and when dependencies change
  useEffect(() => {
    renderStave();
  }, [renderStave]);

  // Add ResizeObserver to handle container size changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      renderStave();
    });

    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, [renderStave]);

  const flashClass =
    flashState === "bad"
      ? "animate-shake border-2 border-rose-400 shadow-lg shadow-rose-400/20"
      : flashState === "good"
        ? "animate-pop-success border-2 border-emerald-400"
        : "";

  return (
    <div className={`h-full rounded-lg bg-white p-2 overflow-hidden transition-all duration-150 ${flashClass}`}>
      <div className="w-full h-full flex items-center justify-center">
        <div ref={containerRef} className="w-full scale-150 sm:scale-125 md:scale-100" style={{ transformOrigin: 'center' }} />
      </div>
    </div>
  );
}
