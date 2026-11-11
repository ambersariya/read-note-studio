import type { KeySig, RangePreset } from "../types";

// --- Key signatures (major) ---
export const KEY_SIGS: KeySig[] = [
  { id: "C", label: "C major (no sharps/flats)", vex: "C", pref: "sharps", fifths: 0 },
  { id: "G", label: "G major (1#)", vex: "G", pref: "sharps", fifths: 1 },
  { id: "D", label: "D major (2#)", vex: "D", pref: "sharps", fifths: 2 },
  { id: "A", label: "A major (3#)", vex: "A", pref: "sharps", fifths: 3 },
  { id: "E", label: "E major (4#)", vex: "E", pref: "sharps", fifths: 4 },
  { id: "B", label: "B major (5#)", vex: "B", pref: "sharps", fifths: 5 },
  { id: "F#", label: "F# major (6#)", vex: "F#", pref: "sharps", fifths: 6 },
  { id: "C#", label: "C# major (7#)", vex: "C#", pref: "sharps", fifths: 7 },
  { id: "F", label: "F major (1b)", vex: "F", pref: "flats", fifths: -1 },
  { id: "Bb", label: "Bb major (2b)", vex: "Bb", pref: "flats", fifths: -2 },
  { id: "Eb", label: "Eb major (3b)", vex: "Eb", pref: "flats", fifths: -3 },
  { id: "Ab", label: "Ab major (4b)", vex: "Ab", pref: "flats", fifths: -4 },
  { id: "Db", label: "Db major (5b)", vex: "Db", pref: "flats", fifths: -5 },
  { id: "Gb", label: "Gb major (6b)", vex: "Gb", pref: "flats", fifths: -6 },
  { id: "Cb", label: "Cb major (7b)", vex: "Cb", pref: "flats", fifths: -7 },
];

// --- Range presets ---
// Note numbers: C4=60, E2=40 (matches standard MIDI note numbering)
export const RANGES: RangePreset[] = [
  { id: "beginner_5", label: "🌱 Beginner: C4–G4", clef: "treble", minMidi: 60, maxMidi: 67 },
  { id: "beginner_7", label: "🌱 Beginner+: C4–B4", clef: "treble", minMidi: 60, maxMidi: 71 },
  { id: "treble_easy", label: "Treble: C4–B4 (easy)", clef: "treble", minMidi: 60, maxMidi: 71 },
  { id: "treble_mid", label: "Treble: C4–C6", clef: "treble", minMidi: 60, maxMidi: 84 },
  { id: "bass_low", label: "Bass: E2–C4", clef: "bass", minMidi: 40, maxMidi: 60 },
  { id: "bass_mid", label: "Bass: C2–C4", clef: "bass", minMidi: 36, maxMidi: 60 },
];
