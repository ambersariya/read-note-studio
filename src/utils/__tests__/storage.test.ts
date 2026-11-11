import { loadStats, saveStats, updateStats, STATS_STORAGE_KEY } from '../noteUtils';
import { loadSettings, saveSettings, SETTINGS_STORAGE_KEY } from '../storage';

const savedNote = { seen: 4, correct: 3, wrong: 1, emaAcc: 0.625 };

beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

describe('legacy note progress', () => {
  it('retains saved progress and persists subsequent answers under the existing key', () => {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify({ 60: savedNote }));
    expect(loadStats()).toEqual({ 60: savedNote });
    saveStats(updateStats(loadStats(), 60, true));
    expect(loadStats()).toEqual({ 60: { seen: 5, correct: 4, wrong: 1, emaAcc: 0.71875 } });
    expect(localStorage.getItem(`${STATS_STORAGE_KEY}_recovery`)).toBeNull();
  });

  it('retains valid notes when other stored entries are invalid', () => {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify({ 60: savedNote, 61: null, 62: { ...savedNote, seen: -1 }, 128: savedNote }));
    expect(loadStats()).toEqual({ 60: savedNote });
  });

  it.each([null, [], 'invalid', { seen: 0, correct: 1, wrong: 0, emaAcc: 2 }])('rejects invalid note records: %p', (entry) => {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify({ 60: entry }));
    expect(loadStats()).toEqual({});
  });

  it.each(['{broken', 'null', '[]', '42'])('preserves unusable original data before saving new progress: %s', (raw) => {
    localStorage.setItem(STATS_STORAGE_KEY, raw);
    expect(loadStats()).toEqual({});
    expect(localStorage.getItem(STATS_STORAGE_KEY)).toBe(raw);
    saveStats({ 60: savedNote });
    expect(localStorage.getItem(`${STATS_STORAGE_KEY}_recovery`)).toBe(raw);
    expect(loadStats()).toEqual({ 60: savedNote });
  });

  it('backs up mixed data before saving the recoverable notes', () => {
    const raw = JSON.stringify({ 60: savedNote, 61: null });
    localStorage.setItem(STATS_STORAGE_KEY, raw);
    saveStats(loadStats());
    expect(localStorage.getItem(`${STATS_STORAGE_KEY}_recovery`)).toBe(raw);
    expect(loadStats()).toEqual({ 60: savedNote });
  });

  it('does not overwrite an earlier recovery copy', () => {
    localStorage.setItem(`${STATS_STORAGE_KEY}_recovery`, 'earlier data');
    localStorage.setItem(STATS_STORAGE_KEY, '{broken');
    saveStats({ 60: savedNote });
    expect(localStorage.getItem(`${STATS_STORAGE_KEY}_recovery`)).toBe('earlier data');
    expect(localStorage.getItem(`${STATS_STORAGE_KEY}_recovery_1`)).toBe('{broken');
  });
});

describe('legacy practice settings', () => {
  it('loads and saves all existing settings without changing their values', () => {
    const settings = { difficulty: 'advanced' as const, rangeId: 'bass_mid', clef: 'bass' as const, keySigId: 'Gb', noteNaming: 'german' as const, showHints: true, showKeyLabels: false, autoAdvance: false, visualHint: true };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    expect(loadSettings()).toEqual(settings);
    saveSettings(settings);
    expect(loadSettings()).toEqual(settings);
    expect(localStorage.getItem(`${SETTINGS_STORAGE_KEY}_recovery`)).toBeNull();
  });

  it('retains valid settings while falling back for invalid fields', () => {
    const raw = JSON.stringify({ difficulty: 'impossible', rangeId: 'missing', clef: 'alto', keySigId: 'unknown', noteNaming: 'unknown', showHints: 'false', autoAdvance: false });
    localStorage.setItem(SETTINGS_STORAGE_KEY, raw);
    expect(loadSettings()).toEqual({ autoAdvance: false });
    saveSettings({ autoAdvance: false });
    expect(localStorage.getItem(`${SETTINGS_STORAGE_KEY}_recovery`)).toBe(raw);
  });

  it('retains recognised fields from a partial legacy record', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ rangeId: 'treble_mid', showHints: false }));
    expect(loadSettings()).toEqual({ rangeId: 'treble_mid', showHints: false });
  });

  it('backs up unknown settings before replacing them', () => {
    const raw = JSON.stringify({ futureSetting: true, autoAdvance: false });
    localStorage.setItem(SETTINGS_STORAGE_KEY, raw);
    saveSettings({ autoAdvance: false });
    expect(localStorage.getItem(`${SETTINGS_STORAGE_KEY}_recovery`)).toBe(raw);
  });
});

describe('unavailable browser storage', () => {
  it('allows practice to start when reads are blocked', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    expect(loadStats()).toEqual({});
    expect(loadSettings()).toEqual({});
  });

  it('allows practice to continue when writes fail', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    expect(() => saveStats({ 60: savedNote })).not.toThrow();
    expect(() => saveSettings({ autoAdvance: true })).not.toThrow();
  });

  it('leaves the original untouched when a recovery copy cannot be saved', () => {
    localStorage.setItem(STATS_STORAGE_KEY, '{broken');
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    saveStats({ 60: savedNote });
    expect(localStorage.getItem(STATS_STORAGE_KEY)).toBe('{broken');
  });
});
