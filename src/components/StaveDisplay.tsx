import type { Clef, KeySig, Note } from "../types";
import { useRef, useEffect } from "react";
import Flow from "vexflow";
import { vexKeyForNote } from "../utils/noteUtils";

const STROKE = "#0f172a"; // dark stroke for visibility on light panel

interface StaveDisplayProps {
  note: Note;
  clef: Clef;
  keySig: KeySig;
  flashState?: "neutral" | "good" | "bad";
}

export function StaveDisplay({ note, clef, keySig, flashState = "neutral" }: StaveDisplayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.innerHTML = "";

    const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = Flow;

    // Make stave responsive to container width
    const width = Math.min(el.clientWidth || 640, 640);
    const scale = 1.35; // zoom everything a bit for readability
    const drawWidth = width / scale;
    const height = 180; // tighter vertical box to reduce whitespace
    const staveWidth = drawWidth - 40; // 20px padding on each side
    const staveY = 26; // place stave closer to the top

    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, height * scale);
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

    const voice = new Voice({ numBeats: 1, beatValue: 4 });
    // Exercises are measure-free: allow incomplete measures.
    voice.setMode(Flow.Voice.Mode.SOFT);
    voice.addTickables([staveNote]);

    new Formatter().joinVoices([voice]).format([voice], 240);
    voice.draw(context, stave);
  }, [note, clef, keySig]);

  const flashClass =
    flashState === "bad"
      ? "stave-flash-bad ring-2 ring-rose-400/70 shadow-[0_0_0_6px_rgba(248,113,113,0.25)]"
      : flashState === "good"
        ? "ring-2 ring-emerald-300/60"
        : "";

  return (
    <div className={`rounded-xl bg-white p-2 overflow-hidden transition-all duration-150 ${flashClass}`}>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
