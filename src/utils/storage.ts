import type { Clef, NoteStats, StatsMap } from '../types';
import { KEY_SIGS, RANGES } from './constants';
import type { NoteNaming } from './noteUtils';

export const STATS_STORAGE_KEY = 'piano_flashcards_stats_v1';
export const SETTINGS_STORAGE_KEY = 'readnote_studio_settings_v1';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Settings {
  difficulty: DifficultyLevel;
  rangeId: string;
  clef: Clef;
  keySigId: string;
  noteNaming: NoteNaming;
  showHints: boolean;
  showKeyLabels: boolean;
  autoAdvance: boolean;
  visualHint: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readStoredValue(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveStoredValue(key: string, value: unknown, isValid: (stored: unknown) => boolean): void {
  try {
    const storage = window.localStorage;
    const raw = storage.getItem(key);
    if (raw !== null) {
      let stored: unknown;
      try {
        stored = JSON.parse(raw);
      } catch {
        stored = null;
      }
      if (!isValid(stored)) {
        // Preserve the exact original before replacing malformed or unknown data.
        let recoveryKey = `${key}_recovery`;
        let suffix = 0;
        let previous = storage.getItem(recoveryKey);
        while (previous !== null && previous !== raw) {
          recoveryKey = `${key}_recovery_${++suffix}`;
          previous = storage.getItem(recoveryKey);
        }
        if (previous === null) storage.setItem(recoveryKey, raw);
      }
    }
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // A failed recovery write must also prevent replacement of the original.
  }
}

function isNoteStats(value: unknown): value is NoteStats {
  if (!isRecord(value)) return false;
  const { seen, correct, wrong, emaAcc } = value;
  return typeof seen === 'number' && Number.isSafeInteger(seen) && seen >= 0
    && typeof correct === 'number' && Number.isSafeInteger(correct) && correct >= 0
    && typeof wrong === 'number' && Number.isSafeInteger(wrong) && wrong >= 0
    && seen === correct + wrong
    && typeof emaAcc === 'number' && Number.isFinite(emaAcc) && emaAcc >= 0 && emaAcc <= 1;
}

function isMidiKey(key: string): boolean {
  const midi = Number(key);
  return Number.isInteger(midi) && midi >= 0 && midi <= 127 && String(midi) === key;
}

export function loadStats(): StatsMap {
  const stored = readStoredValue(STATS_STORAGE_KEY);
  if (!isRecord(stored)) return {};
  const stats: StatsMap = {};
  for (const [key, value] of Object.entries(stored)) {
    if (isMidiKey(key) && isNoteStats(value)) stats[key] = value;
  }
  return stats;
}

export function saveStats(stats: StatsMap): void {
  saveStoredValue(STATS_STORAGE_KEY, stats, (stored) => isRecord(stored)
    && Object.entries(stored).every(([key, value]) => isMidiKey(key) && isNoteStats(value)));
}

function parseSettings(stored: unknown): Partial<Settings> {
  if (!isRecord(stored)) return {};
  const settings: Partial<Settings> = {};
  if (stored.difficulty === 'beginner' || stored.difficulty === 'intermediate' || stored.difficulty === 'advanced') {
    settings.difficulty = stored.difficulty;
  }
  if (typeof stored.rangeId === 'string' && RANGES.some((range) => range.id === stored.rangeId)) settings.rangeId = stored.rangeId;
  if (stored.clef === 'treble' || stored.clef === 'bass') settings.clef = stored.clef;
  if (typeof stored.keySigId === 'string' && KEY_SIGS.some((key) => key.id === stored.keySigId)) settings.keySigId = stored.keySigId;
  if (stored.noteNaming === 'english' || stored.noteNaming === 'solfege' || stored.noteNaming === 'german') {
    settings.noteNaming = stored.noteNaming;
  }
  for (const key of ['showHints', 'showKeyLabels', 'autoAdvance', 'visualHint'] as const) {
    if (typeof stored[key] === 'boolean') settings[key] = stored[key];
  }
  return settings;
}

export function loadSettings(): Partial<Settings> {
  return parseSettings(readStoredValue(SETTINGS_STORAGE_KEY));
}

export function saveSettings(settings: Partial<Settings>): void {
  saveStoredValue(SETTINGS_STORAGE_KEY, settings, (stored) => {
    if (!isRecord(stored)) return false;
    const parsed = parseSettings(stored);
    return Object.keys(stored).length === Object.keys(parsed).length;
  });
}
