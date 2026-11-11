import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { SETTINGS_STORAGE_KEY, STATS_STORAGE_KEY } from './utils/storage';
import { playMidi } from './utils/audio';

jest.mock('./components/StaveDisplay', () => ({ StaveDisplay: () => <div>Musical staff</div> }));
jest.mock('./utils/audio', () => ({ ensureAudioStarted: jest.fn(), playMidi: jest.fn() }));

beforeEach(() => localStorage.clear());

it('restores saved practice settings and retains progress when settings are changed', () => {
  const stats = JSON.stringify({ 48: { seen: 4, correct: 3, wrong: 1, emaAcc: 0.625 } });
  localStorage.setItem(STATS_STORAGE_KEY, stats);
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ rangeId: 'bass_mid', clef: 'bass', difficulty: 'advanced', keySigId: 'Gb', noteNaming: 'german', autoAdvance: false, showHints: true, showKeyLabels: false, visualHint: false }));
  render(<App />);
  fireEvent.click(screen.getByTitle('Settings'));
  expect(screen.getByDisplayValue('Bass: C2–C4')).toBeInTheDocument();
  expect(screen.getByDisplayValue('German (H for B)')).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: 'Auto-Advance' })).not.toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Show Hints' })).toBeChecked();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Show Key Labels' }));
  expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!)).toEqual({ rangeId: 'bass_mid', clef: 'bass', difficulty: 'advanced', keySigId: 'Gb', noteNaming: 'german', autoAdvance: false, showHints: true, showKeyLabels: true, visualHint: false });
  expect(localStorage.getItem(STATS_STORAGE_KEY)).toBe(stats);
});

it('opens practice with usable settings and preserves malformed originals', () => {
  const invalidStats = JSON.stringify({ 60: null });
  const invalidSettings = JSON.stringify({ rangeId: [], autoAdvance: false });
  localStorage.setItem(STATS_STORAGE_KEY, invalidStats);
  localStorage.setItem(SETTINGS_STORAGE_KEY, invalidSettings);
  render(<App />);
  fireEvent.click(screen.getByTitle('Settings'));
  expect(screen.getByDisplayValue('🌱 Beginner: C4–G4')).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: 'Auto-Advance' })).not.toBeChecked();
  expect(localStorage.getItem(`${STATS_STORAGE_KEY}_recovery`)).toBe(invalidStats);
  expect(localStorage.getItem(`${SETTINGS_STORAGE_KEY}_recovery`)).toBe(invalidSettings);
});

it('accepts and plays an in-key black-key answer and records its sounding pitch', async () => {
  jest.useFakeTimers();
  jest.spyOn(Math, 'random').mockReturnValue(0.7);
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ keySigId: 'G', difficulty: 'beginner', autoAdvance: false, showKeyLabels: true }));
    render(<App />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'F#4' })); });
    expect(screen.getByText('✅ Correct! Keep tracking the staff.')).toBeInTheDocument();
    expect(playMidi).toHaveBeenCalledWith(66);
    expect(JSON.parse(localStorage.getItem(STATS_STORAGE_KEY)!)).toEqual({
      66: { seen: 1, correct: 1, wrong: 0, emaAcc: 0.625 },
    });
  } finally {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  }
});
