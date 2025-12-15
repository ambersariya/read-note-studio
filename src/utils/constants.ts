import type { KeySig, RangePreset } from "../types";

// --- Key signatures (major) ---
export const KEY_SIGS: KeySig[] = [
  { id: "C", label: "C major (no sharps/flats)", vex: "C", pref: "sharps" },
  { id: "G", label: "G major (1#)", vex: "G", pref: "sharps" },
  { id: "D", label: "D major (2#)", vex: "D", pref: "sharps" },
  { id: "A", label: "A major (3#)", vex: "A", pref: "sharps" },
  { id: "E", label: "E major (4#)", vex: "E", pref: "sharps" },
  { id: "B", label: "B major (5#)", vex: "B", pref: "sharps" },
  { id: "F#", label: "F# major (6#)", vex: "F#", pref: "sharps" },
  { id: "C#", label: "C# major (7#)", vex: "C#", pref: "sharps" },
  { id: "F", label: "F major (1b)", vex: "F", pref: "flats" },
  { id: "Bb", label: "Bb major (2b)", vex: "Bb", pref: "flats" },
  { id: "Eb", label: "Eb major (3b)", vex: "Eb", pref: "flats" },
  { id: "Ab", label: "Ab major (4b)", vex: "Ab", pref: "flats" },
  { id: "Db", label: "Db major (5b)", vex: "Db", pref: "flats" },
  { id: "Gb", label: "Gb major (6b)", vex: "Gb", pref: "flats" },
  { id: "Cb", label: "Cb major (7b)", vex: "Cb", pref: "flats" },
];

// --- Range presets ---
// MIDI numbers: C4=60, E2=40
export const RANGES: RangePreset[] = [
  { id: "beginner_5", label: "🌱 Beginner: C4–G4 (5 notes)", clef: "treble", minMidi: 60, maxMidi: 67 },
  { id: "beginner_7", label: "🌱 Beginner+: C4–B4 (7 notes)", clef: "treble", minMidi: 60, maxMidi: 71 },
  { id: "treble_easy", label: "Treble: C4–B4 (easy)", clef: "treble", minMidi: 60, maxMidi: 71 },
  { id: "treble_mid", label: "Treble: C4–C6", clef: "treble", minMidi: 60, maxMidi: 84 },
  { id: "bass_low", label: "Bass: E2–C4", clef: "bass", minMidi: 40, maxMidi: 60 },
  { id: "bass_mid", label: "Bass: C2–C4", clef: "bass", minMidi: 36, maxMidi: 60 },
];
