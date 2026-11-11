import { fireEvent, render, screen } from '@testing-library/react';
import { PianoKeyboard } from './PianoKeyboard';
import { KEY_SIGS } from '../utils/constants';
import { buildMidiRange, noteForMidi } from '../utils/noteUtils';

jest.mock('../utils/audio', () => ({ ensureAudioStarted: jest.fn(), playThud: jest.fn() }));

it('allows an in-key black-key answer in beginner practice', () => {
  const signature = KEY_SIGS.find((key) => key.id === 'G')!;
  const onKeyPress = jest.fn();
  render(<PianoKeyboard minMidi={60} maxMidi={67} currentNote={noteForMidi(66, signature)}
    midiChoices={buildMidiRange(60, 67, false, signature)} keySig={signature}
    showHints={false} noteNaming="english" showKeyLabels={true} onKeyPress={onKeyPress} />);
  expect(screen.getByRole('button', { name: 'F#4' })).toHaveAttribute('aria-disabled', 'false');
  expect(screen.getByRole('button', { name: 'F4' })).toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'F#4' }));
  expect(onKeyPress).toHaveBeenCalledWith(66);
});

it('labels a white piano key by its in-key enharmonic spelling', () => {
  const signature = KEY_SIGS.find((key) => key.id === 'C#')!;
  render(<PianoKeyboard minMidi={60} maxMidi={67} currentNote={noteForMidi(60, signature)}
    midiChoices={buildMidiRange(60, 67, false, signature)} keySig={signature}
    showHints={false} noteNaming="english" showKeyLabels={true} onKeyPress={jest.fn()} />);
  expect(screen.getByRole('button', { name: 'B#3' })).toHaveAttribute('aria-disabled', 'false');
  expect(screen.getByRole('button', { name: 'E#4' })).toHaveAttribute('aria-disabled', 'false');
});
