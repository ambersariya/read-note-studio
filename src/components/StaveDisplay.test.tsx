import { render } from '@testing-library/react';
import { StaveDisplay } from './StaveDisplay';
import { KEY_SIGS } from '../utils/constants';
import { noteForMidi } from '../utils/noteUtils';

beforeEach(() => {
  jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800);
  jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
  // jsdom has no canvas font metrics; the real VexFlow SVG renderer still runs.
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({
    font: '',
    measureText: (text: string) => ({ width: text.length * 12, actualBoundingBoxAscent: 12, actualBoundingBoxDescent: 3 }),
  } as CanvasRenderingContext2D));
});

afterEach(() => jest.restoreAllMocks());

it('renders a natural sign for F natural under a G major signature', () => {
  const signature = KEY_SIGS.find((key) => key.id === 'G')!;
  const { container } = render(<StaveDisplay note={noteForMidi(65, signature)} clef="treble" keySig={signature} />);
  expect(container.querySelector('svg')?.textContent).toContain('\uE261');
});

it.each([['G', 66, 2], ['F#', 65, 12], ['C#', 60, 14]] as const)(
  'does not repeat a sharp already supplied by the %s major signature', (id, midi, sharpCount) => {
    const signature = KEY_SIGS.find((key) => key.id === id)!;
    const { container } = render(<StaveDisplay note={noteForMidi(midi, signature)} clef="treble" keySig={signature} />);
    const notation = container.querySelector('svg')?.textContent ?? '';
    expect(notation.split('\uE262').length - 1).toBe(sharpCount);
  },
);

it('renders the played note with its own spelling after a wrong answer', () => {
  const signature = KEY_SIGS[0];
  const { container } = render(<StaveDisplay note={noteForMidi(64, signature)} clef="treble" keySig={signature} playedMidi={61} />);
  expect(container.querySelector('svg')?.textContent).toContain('\uE262');
});

it('restores the target sharp after showing a wrong natural on the same staff position', () => {
  const signature = KEY_SIGS.find((key) => key.id === 'G')!;
  const { container } = render(<StaveDisplay note={noteForMidi(66, signature)} clef="treble" keySig={signature} playedMidi={65} />);
  const notation = container.querySelector('svg')?.textContent ?? '';
  expect(notation).toContain('\uE261');
  expect(notation.split('\uE262').length - 1).toBe(3);
});
