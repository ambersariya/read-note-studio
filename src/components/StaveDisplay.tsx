'use client';

import type { Clef, KeySig, Note } from "../types";
import { useRef, useEffect, useCallback } from "react";
import Flow, { type Tickable } from "vexflow";
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

    const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, GhostNote, StaveConnector } = Flow;

    // Dynamically calculate dimensions based on container
    const containerWidth = el.clientWidth;

    // Calculate scale based on container width (keep height compact)
    const scale = Math.max(Math.min(containerWidth / 620, 1.5), 1.0);

    const drawWidth = containerWidth / scale;
    // Room for a full grand staff (treble + bass) with tighter vertical footprint
    const baseStaveHeight = 165;
    const staveWidth = drawWidth - 40;
    const trebleY = 12; // Small top margin
    const staffGap = 74;
    const bassY = trebleY + staffGap;

    const renderer = new Renderer(el, Renderer.Backends.SVG);
    // SVG height is just what the staff needs, not the full container
    renderer.resize(containerWidth, baseStaveHeight * scale);
    const context = renderer.getContext();
    context.scale(scale, scale);
    context.setFillStyle(STROKE);
    context.setStrokeStyle(STROKE);

    const trebleStave = new Stave(20, trebleY, staveWidth);
    trebleStave.addClef("treble");
    trebleStave.addKeySignature(keySig.vex);
    trebleStave.setContext(context).draw();

    const bassStave = new Stave(20, bassY, staveWidth);
    bassStave.addClef("bass");
    bassStave.addKeySignature(keySig.vex);
    bassStave.setContext(context).draw();

    // Connect the two staves for a proper grand staff presentation
    [
      StaveConnector.type.BRACE,
      StaveConnector.type.SINGLE_LEFT,
      StaveConnector.type.SINGLE_RIGHT,
    ].forEach((type) => {
      const connector = new StaveConnector(trebleStave, bassStave);
      connector.setType(type);
      connector.setContext(context);
      connector.draw();
    });

    const clefForMidi = (midi: number): Clef => (midi >= 60 ? "treble" : "bass");
    const activeClef: Clef = clef;
    const targetStave = activeClef === "treble" ? trebleStave : bassStave;

    const keys = [vexKeyForNote(note)];
    const staveNote = new StaveNote({
      clef: activeClef,
      keys,
      duration: "q",
    })
      .setStyle({ strokeStyle: STROKE, fillStyle: STROKE })
      .setStave(targetStave);

    // If our key string includes an accidental, add it explicitly so it's always shown.
    if (note.spelling.accidental === "#" || note.spelling.accidental === "b") {
      staveNote.addModifier(new Accidental(note.spelling.accidental));
    }

    const trebleNotes: Tickable[] = [];
    const bassNotes: Tickable[] = [];

    // Display ghost note (the wrong note played) in red to show error distance
    if (playedMidi !== null && playedMidi !== note.midi) {
      const wrongSpelling = { midi: playedMidi, spelling: { ...note.spelling } };
      const wrongClef = clefForMidi(playedMidi);
      const wrongStave = wrongClef === "treble" ? trebleStave : bassStave;

      // Simple ghost note - just show at the played MIDI position
      const wrongKey = vexKeyForNote(wrongSpelling);
      const wrongNote = new StaveNote({
        clef: wrongClef,
        keys: [wrongKey],
        duration: "q",
      })
        .setStave(wrongStave)
        .setStyle({
          strokeStyle: "rgba(248,113,113,0.7)",
          fillStyle: "rgba(248,113,113,0.35)",
        });

      if (wrongClef === "treble") {
        trebleNotes.push(wrongNote);
      } else {
        bassNotes.push(wrongNote);
      }
    }

    if (activeClef === "treble") {
      trebleNotes.push(staveNote);
    } else {
      bassNotes.push(staveNote);
    }

    const voiceTreble = new Voice({ numBeats: 1, beatValue: 4 });
    voiceTreble.setMode(Flow.Voice.Mode.SOFT);
    voiceTreble.addTickables(trebleNotes.length ? trebleNotes : [new GhostNote("q")]);

    const voiceBass = new Voice({ numBeats: 1, beatValue: 4 });
    voiceBass.setMode(Flow.Voice.Mode.SOFT);
    voiceBass.addTickables(bassNotes.length ? bassNotes : [new GhostNote("q")]);

    new Formatter().joinVoices([voiceTreble, voiceBass]).format([voiceTreble, voiceBass], 300);
    voiceTreble.draw(context, trebleStave);
    voiceBass.draw(context, bassStave);
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
        <div className="w-full flex items-center justify-center px-4">
          <div ref={containerRef} className="w-full max-w-md" style={{ transformOrigin: "center" }} />
        </div>
      </div>
    </div>
  );
}
