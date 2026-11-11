import { KEY_SIGS, RANGES } from '../constants';
import { buildMidiRange, noteForMidi, noteLabel, noteLabelWithNaming, vexKeyForNote } from '../noteUtils';

const majorScales: [string, number, string[]][] = [
  ['C', 60, ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']],
  ['G', 67, ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5']],
  ['D', 62, ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5']],
  ['A', 69, ['A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'G#5']],
  ['E', 64, ['E4', 'F#4', 'G#4', 'A4', 'B4', 'C#5', 'D#5']],
  ['B', 71, ['B4', 'C#5', 'D#5', 'E5', 'F#5', 'G#5', 'A#5']],
  ['F#', 66, ['F#4', 'G#4', 'A#4', 'B4', 'C#5', 'D#5', 'E#5']],
  ['C#', 61, ['C#4', 'D#4', 'E#4', 'F#4', 'G#4', 'A#4', 'B#4']],
  ['F', 65, ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5']],
  ['Bb', 70, ['Bb4', 'C5', 'D5', 'Eb5', 'F5', 'G5', 'A5']],
  ['Eb', 63, ['Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5', 'D5']],
  ['Ab', 68, ['Ab4', 'Bb4', 'C5', 'Db5', 'Eb5', 'F5', 'G5']],
  ['Db', 61, ['Db4', 'Eb4', 'F4', 'Gb4', 'Ab4', 'Bb4', 'C5']],
  ['Gb', 66, ['Gb4', 'Ab4', 'Bb4', 'Cb5', 'Db5', 'Eb5', 'F5']],
  ['Cb', 59, ['Cb4', 'Db4', 'Eb4', 'Fb4', 'Gb4', 'Ab4', 'Bb4']],
];

function key(id: string) {
  return KEY_SIGS.find((signature) => signature.id === id)!;
}

it.each(majorScales)('generates and spells the seven notes of %s major', (id, tonic, labels) => {
  const choices = buildMidiRange(tonic, tonic + 11, false, key(id));
  expect(choices).toEqual([0, 2, 4, 5, 7, 9, 11].map((interval) => tonic + interval));
  expect(choices.map((midi) => noteLabel(noteForMidi(midi, key(id))))).toEqual(labels);
});

it.each(KEY_SIGS)('keeps every preset within its sounding-pitch bounds in $id major', (signature) => {
  for (const range of RANGES) {
    const choices = buildMidiRange(range.minMidi, range.maxMidi, false, signature);
    expect(choices.length).toBeGreaterThan(1);
    expect(choices.every((midi) => midi >= range.minMidi && midi <= range.maxMidi)).toBe(true);
  }
});

it('includes F sharp and excludes F natural for beginner practice in G major', () => {
  expect(buildMidiRange(60, 67, false, key('G'))).toEqual([60, 62, 64, 66, 67]);
});

it('retains all semitones when chromatic practice is enabled', () => {
  expect(buildMidiRange(60, 67, true, key('G'))).toEqual([60, 61, 62, 63, 64, 65, 66, 67]);
});

it('handles single-pitch and empty diatonic ranges without escaping their bounds', () => {
  expect(buildMidiRange(66, 66, false, key('G'))).toEqual([66]);
  expect(buildMidiRange(65, 65, false, key('G'))).toEqual([]);
});

it.each([
  [60, 'C#', 'B#3', 'b#/3'],
  [59, 'Cb', 'Cb4', 'cb/4'],
  [65, 'F#', 'E#4', 'e#/4'],
  [64, 'Cb', 'Fb4', 'fb/4'],
  [65, 'G', 'F4', 'f/4'],
  [61, 'F', 'Db4', 'db/4'],
] as const)('spells MIDI %i in %s major as %s at the correct staff position', (midi, id, label, vexKey) => {
  const note = noteForMidi(midi, key(id));
  expect(noteLabel(note)).toBe(label);
  expect(vexKeyForNote(note)).toBe(vexKey);
});

it.each(KEY_SIGS)('preserves the sounding pitch of every MIDI note in $id major', (signature) => {
  const naturalPitches = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  for (let midi = 0; midi <= 127; midi++) {
    const note = noteForMidi(midi, signature);
    const alteration = note.spelling.accidental === '#' ? 1 : note.spelling.accidental === 'b' ? -1 : 0;
    expect((note.octave + 1) * 12 + naturalPitches[note.spelling.letter] + alteration).toBe(midi);
  }
});

it('uses German H for B natural and B for B flat without doubling the flat', () => {
  expect(noteLabelWithNaming(noteForMidi(71, key('C')), 'german')).toBe('H4');
  expect(noteLabelWithNaming(noteForMidi(70, key('F')), 'german')).toBe('B4');
});

it('preserves accidental and written octave in English and fixed-do solfege labels', () => {
  expect(noteLabelWithNaming(noteForMidi(60, key('C#')), 'english')).toBe('B#3');
  expect(noteLabelWithNaming(noteForMidi(65, key('F#')), 'solfege')).toBe('Mi#4');
});
