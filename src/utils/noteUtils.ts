import type { AccidentalPref, Note, NoteStats, PitchSpelling, StatsMap } from "../types";

export const DEFAULT_STATS: NoteStats = { seen: 0, correct: 0, wrong: 0, emaAcc: 0.5 };
export const STATS_STORAGE_KEY = "piano_flashcards_stats_v1";

// --- Pitch spelling helpers ---
const SHARP_NAMES: Record<number, PitchSpelling> = {
  0: { letter: "C", accidental: "" },
  1: { letter: "C", accidental: "#" },
  2: { letter: "D", accidental: "" },
  3: { letter: "D", accidental: "#" },
  4: { letter: "E", accidental: "" },
  5: { letter: "F", accidental: "" },
  6: { letter: "F", accidental: "#" },
  7: { letter: "G", accidental: "" },
  8: { letter: "G", accidental: "#" },
  9: { letter: "A", accidental: "" },
  10: { letter: "A", accidental: "#" },
  11: { letter: "B", accidental: "" },
};

const FLAT_NAMES: Record<number, PitchSpelling> = {
  0: { letter: "C", accidental: "" },
  1: { letter: "D", accidental: "b" },
  2: { letter: "D", accidental: "" },
  3: { letter: "E", accidental: "b" },
  4: { letter: "E", accidental: "" },
  5: { letter: "F", accidental: "" },
  6: { letter: "G", accidental: "b" },
  7: { letter: "G", accidental: "" },
  8: { letter: "A", accidental: "b" },
  9: { letter: "A", accidental: "" },
  10: { letter: "B", accidental: "b" },
  11: { letter: "B", accidental: "" },
};

export function midiToOctave(midi: number): number {
  // C4=60, octave = floor(noteNumber/12)-1
  return Math.floor(midi / 12) - 1;
}

export function midiToPitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

export function spellMidi(midi: number, pref: AccidentalPref): PitchSpelling {
  const pc = midiToPitchClass(midi);
  return pref === "flats" ? FLAT_NAMES[pc] : SHARP_NAMES[pc];
}

export function noteLabel(note: Note): string {
  return `${note.spelling.letter}${note.spelling.accidental}${midiToOctave(note.midi)}`;
}

export type NoteNaming = "english" | "solfege" | "german";

function baseNameForNaming(letter: PitchSpelling["letter"], accidental: PitchSpelling["accidental"], naming: NoteNaming): string {
  if (naming === "solfege") {
    const map: Record<PitchSpelling["letter"], string> = {
      C: "Do",
      D: "Re",
      E: "Mi",
      F: "Fa",
      G: "Sol",
      A: "La",
      B: "Ti",
    };
    return map[letter];
  }

  if (naming === "german") {
    if (letter === "B" && accidental === "") return "H";
    if (letter === "B" && accidental === "b") return "B";
  }

  return letter;
}

export function noteLabelWithNaming(note: Note, naming: NoteNaming): string {
  const base = baseNameForNaming(note.spelling.letter, note.spelling.accidental, naming);
  const acc = naming === "german" && note.spelling.letter === "B" && note.spelling.accidental === ""
    ? ""
    : note.spelling.accidental;
  const oct = midiToOctave(note.midi);
  return `${base}${acc}${oct}`;
}

export function vexKeyForNote(note: Note): string {
  // VexFlow key format: "c#/4" etc.
  const l = note.spelling.letter.toLowerCase();
  const acc = note.spelling.accidental;
  const oct = midiToOctave(note.midi);
  return `${l}${acc}/${oct}`;
}

export function statsKey(midi: number): string {
  return String(midi);
}

export function loadStats(): StatsMap {
  try {
    const raw = window.localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StatsMap;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function saveStats(stats: StatsMap): void {
  try {
    window.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function getStats(stats: StatsMap, midi: number): NoteStats {
  return stats[statsKey(midi)] ?? { ...DEFAULT_STATS };
}

export function updateStats(stats: StatsMap, midi: number, wasCorrect: boolean): StatsMap {
  const k = statsKey(midi);
  const cur = stats[k] ?? { ...DEFAULT_STATS };
  const seen = cur.seen + 1;
  const correct = cur.correct + (wasCorrect ? 1 : 0);
  const wrong = cur.wrong + (wasCorrect ? 0 : 1);
  // EMA: weight recent answers more (alpha=0.25)
  const alpha = 0.25;
  const emaAcc = (1 - alpha) * cur.emaAcc + alpha * (wasCorrect ? 1 : 0);
  return { ...stats, [k]: { seen, correct, wrong, emaAcc } };
}

export function weightForMidi(stats: StatsMap, midi: number): number {
  const s = getStats(stats, midi);
  // Higher weight if low accuracy or many wrongs; never below 1
  const penalty = 1 + s.wrong * 0.6;
  const difficulty = 1 + (1 - s.emaAcc) * 2.5;
  const novelty = s.seen === 0 ? 1.8 : 1;
  const w = penalty * difficulty * novelty;
  return Math.max(1, Math.min(8, w));
}

export function weightedPick(items: number[], weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[Math.floor(Math.random() * items.length)];
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function buildMidiRange(minMidi: number, maxMidi: number, includeAccidentals: boolean): number[] {
  const out: number[] = [];
  for (let m = minMidi; m <= maxMidi; m++) {
    const pc = midiToPitchClass(m);
    const isNatural = pc === 0 || pc === 2 || pc === 4 || pc === 5 || pc === 7 || pc === 9 || pc === 11;
    if (includeAccidentals || isNatural) out.push(m);
  }
  return out;
}

export function isBlackKey(midi: number): boolean {
  const pc = midiToPitchClass(midi);
  return pc === 1 || pc === 3 || pc === 6 || pc === 8 || pc === 10;
}

export function getBlackKeyIndex(midi: number): number {
  // Returns the index within an octave (0-4) for black keys
  // C# = 0, D# = 1, F# = 2, G# = 3, A# = 4
  const pc = midiToPitchClass(midi);
  if (pc === 1) return 0; // C#
  if (pc === 3) return 1; // D#
  if (pc === 6) return 2; // F#
  if (pc === 8) return 3; // G#
  if (pc === 10) return 4; // A#
  return -1; // Not a black key
}

export function whiteKeyLabel(midi: number, pref: AccidentalPref, naming: NoteNaming = "english"): string {
  const spelling = spellMidi(midi, pref);
  return baseNameForNaming(spelling.letter, spelling.accidental, naming);
}
