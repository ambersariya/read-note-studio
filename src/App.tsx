"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Clef, Feedback, Note, StatsMap } from "./types";
import { KEY_SIGS, RANGES } from "./utils/constants";
import {
  buildMidiRange,
  loadStats,
  noteLabelWithNaming,
  saveStats,
  spellMidi,
  updateStats,
  weightedPick,
  weightForMidi,
  type NoteNaming,
} from "./utils/noteUtils";
import { ensureAudioStarted, playMidi } from "./utils/audio";
import { StaveDisplay } from "./components/StaveDisplay";
import { PianoKeyboard } from "./components/PianoKeyboard";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { MemoryAidsModal } from "./components/MemoryAidsModal";

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

const APP_VERSION = "1.3.0";
const SETTINGS_STORAGE_KEY = "readnote_studio_settings_v1";

function loadSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function App() {
  const savedSettings = loadSettings();
  
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(savedSettings?.difficulty ?? "beginner");
  const [showHints, setShowHints] = useState<boolean>(savedSettings?.showHints ?? false);
  const [showKeyLabels, setShowKeyLabels] = useState<boolean>(savedSettings?.showKeyLabels ?? false);
  const [rangeId, setRangeId] = useState<string>(savedSettings?.rangeId ?? RANGES[0].id);
  const range = useMemo(() => RANGES.find((r) => r.id === rangeId) ?? RANGES[0], [rangeId]);

  const [clef, setClef] = useState<Clef>(savedSettings?.clef ?? range.clef);
  const [keySigId, setKeySigId] = useState<string>(savedSettings?.keySigId ?? KEY_SIGS[0].id);
  const keySig = useMemo(() => KEY_SIGS.find((k) => k.id === keySigId) ?? KEY_SIGS[0], [keySigId]);
  const [noteNaming, setNoteNaming] = useState<NoteNaming>(savedSettings?.noteNaming ?? "english");
  const [autoAdvance, setAutoAdvance] = useState<boolean>(savedSettings?.autoAdvance ?? true);
  const [visualHint, setVisualHint] = useState<boolean>(savedSettings?.visualHint ?? true);

  // Derive includeAccidentals from difficulty level
  const includeAccidentals = useMemo(() => {
    if (difficulty === "beginner") return false;
    return true;
  }, [difficulty]);
  const [stats, setStats] = useState<StatsMap>(() => loadStats());
  const [current, setCurrent] = useState<Note>(() => {
    const midi = 60;
    return { midi, spelling: spellMidi(midi, KEY_SIGS[0].pref) };
  });
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [notesPerMinute, setNotesPerMinute] = useState<number>(0);
  const [sessionSummary, setSessionSummary] = useState<{
    avgNpm: number;
    accuracy: number;
    correct: number;
    attempts: number;
  } | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({
    type: "neutral",
    text: "Play the note shown on the staff."
  });
  const [flashState, setFlashState] = useState<"neutral" | "good" | "bad">("neutral");
  const [flashMidi, setFlashMidi] = useState<number | null>(null);
  const [hintForced, setHintForced] = useState<boolean>(false);
  const sessionStartRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const npmIntervalRef = useRef<number | null>(null);
  const correctCountRef = useRef<number>(0);
  const attemptsRef = useRef<number>(0);
  const visualHintTimerRef = useRef<number | null>(null);

  const midiChoices = useMemo(
    () => buildMidiRange(range.minMidi, range.maxMidi, includeAccidentals),
    [range, includeAccidentals]
  );

  // Keep clef in sync with range preset
  useEffect(() => {
    setClef(range.clef);
  }, [range.clef]);

  // Persist stats
  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  // Persist settings
  useEffect(() => {
    try {
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          rangeId,
          clef,
          keySigId,
          difficulty,
          showHints,
          showKeyLabels,
          noteNaming,
          autoAdvance,
          visualHint,
        })
      );
    } catch {
      // ignore
    }
  }, [rangeId, clef, keySigId, difficulty, showHints, showKeyLabels, noteNaming, autoAdvance, visualHint]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current);
      }
      if (npmIntervalRef.current !== null) {
        window.clearInterval(npmIntervalRef.current);
      }
      if (visualHintTimerRef.current !== null) {
        window.clearTimeout(visualHintTimerRef.current);
      }
    };
  }, []);

  // Visual hint timer per note
  useEffect(() => {
    if (visualHintTimerRef.current !== null) {
      window.clearTimeout(visualHintTimerRef.current);
    }
    setHintForced(false);
    if (visualHint) {
      visualHintTimerRef.current = window.setTimeout(() => setHintForced(true), 5000);
    }
    return () => {
      if (visualHintTimerRef.current !== null) {
        window.clearTimeout(visualHintTimerRef.current);
      }
    };
  }, [current, visualHint]);

  function pickNextNote(avoidMidi?: number): Note {
    const weights = midiChoices.map((m) => weightForMidi(stats, m));

    // Try to avoid immediate repeats when we have options
    let choices = midiChoices;
    let adjustedWeights = weights;
    if (avoidMidi !== undefined && midiChoices.length > 1) {
      const filtered = midiChoices
        .map((m, idx) => ({ midi: m, weight: weights[idx] }))
        .filter(({ midi }) => midi !== avoidMidi);
      if (filtered.length > 0) {
        choices = filtered.map((c) => c.midi);
        adjustedWeights = filtered.map((c) => c.weight);
      }
    }

    const midi = weightedPick(choices, adjustedWeights);
    return { midi, spelling: spellMidi(midi, keySig.pref) };
  }

  // When settings change, refresh the exercise note
  useEffect(() => {
    const next = pickNextNote(current.midi);
    setCurrent(next);
    setFeedback({ type: "neutral", text: "Play the note shown on the staff." });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeId, difficulty, keySigId]);

  const next = (avoidMidi?: number): void => {
    const midiToAvoid = avoidMidi ?? current.midi;
    setCurrent(pickNextNote(midiToAvoid));
    setFeedback({ type: "neutral", text: "Play the note shown on the staff." });
    setHintForced(false);
  };

  const submitMidi = async (answerMidi: number): Promise<void> => {
    await ensureAudioStarted();

    const correct = answerMidi === current.midi;
    const now = Date.now();
    const nextAttempts = attemptsRef.current + 1;
    attemptsRef.current = nextAttempts;
    setAttempts(nextAttempts);

    // Only play the clicked note
    playMidi(answerMidi);

    setStats((s) => updateStats(s, current.midi, correct));

    if (correct) {
      setScore((v) => v + 1);
      setStreak((v) => v + 1);
      setFeedback({ type: "good", text: `✅ Correct: ${noteLabelWithNaming(current, noteNaming)}` });
      setFlashState("good");
      setFlashMidi(null);

      const nextCorrect = correctCountRef.current + 1;
      correctCountRef.current = nextCorrect;

      if (sessionStartRef.current === null) {
        sessionStartRef.current = now;
        if (npmIntervalRef.current !== null) {
          window.clearInterval(npmIntervalRef.current);
        }
        npmIntervalRef.current = window.setInterval(() => {
          const start = sessionStartRef.current;
          if (!start) return;
          const seconds = Math.max((Date.now() - start) / 1000, 1);
          const npm = (correctCountRef.current / seconds) * 60;
          setNotesPerMinute(Number(npm.toFixed(1)));
        }, 1000);
      }

      if (nextCorrect % 20 === 0) {
        const start = sessionStartRef.current ?? now;
        const seconds = Math.max((now - start) / 1000, 1);
        const avgNpm = (correctCountRef.current / seconds) * 60;
        const accuracy = attemptsRef.current === 0 ? 0 : Math.round((correctCountRef.current / attemptsRef.current) * 100);
        setSessionSummary({
          avgNpm: Number(avgNpm.toFixed(1)),
          accuracy,
          correct: correctCountRef.current,
          attempts: attemptsRef.current,
        });
      }
    } else {
      setStreak(0);
      const your = { midi: answerMidi, spelling: spellMidi(answerMidi, keySig.pref) };
      setFeedback({ 
        type: "bad", 
        text: `❌ Nope — it was ${noteLabelWithNaming(current, noteNaming)} (you played ${noteLabelWithNaming(your, noteNaming)})` 
      });
      setFlashState("bad");
      setFlashMidi(answerMidi);
    }

    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = window.setTimeout(() => {
      setFlashState("neutral");
      setFlashMidi(null);
    }, 320);

    const delay = correct && autoAdvance ? 200 : 700;
    window.setTimeout(() => next(current.midi), delay);
  };

  const handleResetStats = (): void => {
    setStats({});
    setScore(0);
    setStreak(0);
    setAttempts(0);
    setNotesPerMinute(0);
    correctCountRef.current = 0;
    attemptsRef.current = 0;
    setSessionSummary(null);
    sessionStartRef.current = null;
    if (npmIntervalRef.current !== null) {
      window.clearInterval(npmIntervalRef.current);
      npmIntervalRef.current = null;
    }
    setFeedback({ type: "neutral", text: "Stats cleared. Ready for a fresh session!" });
    next();
  };

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden pb-2">
      {/* Mobile-First HUD */}
      <div className="relative shrink-0 flex items-center justify-between gap-2 bg-zinc-900/80 backdrop-blur-md px-3 py-2.5 border-b border-zinc-800">
        {/* Left: Title (hidden on mobile) */}
        <div className="hidden md:block">
          <h1 className="text-base font-semibold tracking-tight lg:text-lg">
            ReadNote Studio
            <span className="ml-2 text-xs font-normal text-zinc-400">v{APP_VERSION}</span>
          </h1>
        </div>

        {/* Center: Stats (locked to center) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-6 px-3 py-1 rounded-md">
          <div className="text-xs font-mono text-zinc-400 whitespace-nowrap">
            NPM <span className="font-semibold text-emerald-400 text-sm">{notesPerMinute.toFixed(1)}</span>
          </div>
          <div className="text-xs font-mono text-zinc-400 whitespace-nowrap">
            ACC <span className="font-semibold text-blue-400 text-sm">{attempts === 0 ? 0 : Math.round((score / attempts) * 100)}%</span>
          </div>
          {/* Streak: Hidden on mobile, shown on md+ */}
          <div className="hidden md:block text-xs font-mono text-zinc-400 whitespace-nowrap">
            STREAK <span className="font-semibold text-amber-400 text-sm">{streak}</span>
          </div>
        </div>

        {/* Right: Action Icons */}
        <div className="flex items-center gap-1">
          <MemoryAidsModal />
          <button
            onClick={() => setFeedback({ type: "neutral", text: `The note is: ${current.spelling.letter}${current.spelling.accidental}` })}
            className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Reveal answer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={handleResetStats}
            className="p-2 text-zinc-400 hover:text-rose-400 transition-colors"
            title="Reset stats"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
          <SettingsDrawer
            rangeId={rangeId}
            clef={clef}
            keySigId={keySigId}
            difficulty={difficulty}
            showHints={showHints}
            currentNote={current}
            range={range}
            keySig={keySig}
            onRangeChange={setRangeId}
            onClefChange={setClef}
            onKeySigChange={setKeySigId}
          onDifficultyChange={setDifficulty}
          onShowHintsChange={setShowHints}
          showKeyLabels={showKeyLabels}
          onShowKeyLabelsChange={setShowKeyLabels}
          noteNaming={noteNaming}
          onNoteNamingChange={setNoteNaming}
          autoAdvance={autoAdvance}
          onAutoAdvanceChange={setAutoAdvance}
          visualHint={visualHint}
            onVisualHintChange={setVisualHint}
          />
        </div>
      </div>

      {/* Main Content Area - Mobile First with sticky piano */}
      <div className="flex-1 flex flex-col md:px-4 md:py-3 overflow-hidden gap-3">
        {/* The Stage - Staff Card */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 rounded-none md:rounded-xl bg-white p-3 md:p-4 flex flex-col min-h-[320px] shadow-lg shadow-zinc-900/30">
            {/* Feedback pill */}
            <div className={`mb-1 md:mb-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-center transition-all duration-200 ${
              feedback.type === "good"
                ? "bg-emerald-500 text-white ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/50 font-semibold"
                : feedback.type === "bad"
                  ? "bg-rose-500 text-white ring-2 ring-rose-400 shadow-lg shadow-rose-500/50 font-semibold"
                  : "bg-zinc-800 text-zinc-200 ring-1 ring-zinc-700"
            }`}>
              {feedback.text}
            </div>

            {/* Musical Staff */}
            <div className="flex-1 min-h-[260px] md:min-h-[320px] animate-slide-in">
              <StaveDisplay
                note={current}
                clef={clef}
                keySig={keySig}
                flashState={flashState}
                playedMidi={flashMidi}
              />
            </div>

            {/* Action buttons - Hidden on mobile, shown on md+ */}
            <div className="mt-1 md:mt-1.5 hidden md:flex flex-wrap items-center gap-2">
              {!autoAdvance && (
                <button
                  onClick={() => next()}
                  className="rounded-lg bg-zinc-900 text-zinc-100 px-3 py-2 text-sm font-semibold border border-zinc-800 hover:bg-zinc-800 transition"
                >
                  Next
                </button>
              )}

              <button
                onClick={async () => {
                  await ensureAudioStarted();
                  playMidi(current.midi);
                }}
                className="rounded-lg bg-zinc-900 text-zinc-100 px-3 py-2 text-sm font-semibold border border-zinc-800 hover:bg-zinc-800 transition"
              >
                Play note
              </button>
            </div>

            {/* Session Summary Modal */}
            {sessionSummary ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="w-full max-w-sm rounded-lg bg-emerald-50 p-4 md:p-5 border border-emerald-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-emerald-900">Session Summary</div>
                      <div className="text-xs text-emerald-800">
                        After {sessionSummary.correct} correct notes
                      </div>
                    </div>
                    <button
                      onClick={() => setSessionSummary(null)}
                      className="rounded-full p-2 text-emerald-700 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      aria-label="Close summary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs md:text-sm">
                    <div className="rounded-md bg-white p-2 md:p-3 border border-emerald-100 shadow-sm">
                      <div className="text-xs font-semibold text-emerald-700">Avg NPM</div>
                      <div className="text-[8px] font-normal opacity-70 text-emerald-700">(Notes Per Minute)</div>
                      <div className="text-base md:text-lg font-semibold text-emerald-950">{sessionSummary.avgNpm}</div>
                    </div>
                    <div className="rounded-md bg-white p-2 md:p-3 border border-emerald-100 shadow-sm">
                      <div className="text-xs font-semibold text-emerald-700">Accuracy</div>
                      <div className="text-base md:text-lg font-semibold text-emerald-950">{sessionSummary.accuracy}%</div>
                    </div>
                    <div className="rounded-md bg-white p-2 md:p-3 border border-emerald-100 shadow-sm">
                      <div className="text-xs font-semibold text-emerald-700">Attempts</div>
                      <div className="text-base md:text-lg font-semibold text-emerald-950">{sessionSummary.attempts}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSessionSummary(null)}
                    className="mt-4 w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-bold text-white shadow-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-emerald-50"
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Piano Keyboard - Shrink-0 at bottom on mobile, relative on desktop */}
        <div className="flex-1 md:mt-2 bg-zinc-950 md:bg-transparent min-h-[220px]">
          <PianoKeyboard
            minMidi={range.minMidi}
            maxMidi={range.maxMidi}
            currentNote={current}
            includeAccidentals={includeAccidentals}
            midiChoices={midiChoices}
            keySigPref={keySig.pref}
            showHints={showHints}
            showKeyLabels={showKeyLabels}
            noteNaming={noteNaming}
            hintForced={hintForced}
            flashMidi={flashMidi}
            flashState={flashState}
            onKeyPress={(midi) => void submitMidi(midi)}
          />
        </div>
      </div>
    </div>
  );
}
