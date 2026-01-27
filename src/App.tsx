import { useEffect, useMemo, useRef, useState } from "react";
import type { Clef, Feedback, Note, StatsMap } from "./types";
import { KEY_SIGS, RANGES } from "./utils/constants";
import {
  buildMidiRange,
  loadStats,
  noteLabel,
  saveStats,
  spellMidi,
  updateStats,
  weightedPick,
  weightForMidi,
} from "./utils/noteUtils";
import { ensureAudioStarted, playMidi } from "./utils/audio";
import { StaveDisplay } from "./components/StaveDisplay";
import { ScoreBoard } from "./components/ScoreBoard";
import { PianoKeyboard } from "./components/PianoKeyboard";
import { SettingsPanel } from "./components/SettingsPanel";

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

const APP_VERSION = "1.3.0";
const SETTINGS_STORAGE_KEY = "piano_flashcards_settings_v1";

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
  const [rangeId, setRangeId] = useState<string>(savedSettings?.rangeId ?? RANGES[0].id);
  const range = useMemo(() => RANGES.find((r) => r.id === rangeId) ?? RANGES[0], [rangeId]);

  const [clef, setClef] = useState<Clef>(savedSettings?.clef ?? range.clef);
  const [keySigId, setKeySigId] = useState<string>(savedSettings?.keySigId ?? KEY_SIGS[0].id);
  const keySig = useMemo(() => KEY_SIGS.find((k) => k.id === keySigId) ?? KEY_SIGS[0], [keySigId]);

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
    text: "Click a piano key to answer." 
  });
  const [flashState, setFlashState] = useState<"neutral" | "good" | "bad">("neutral");
  const [flashMidi, setFlashMidi] = useState<number | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const npmIntervalRef = useRef<number | null>(null);
  const correctCountRef = useRef<number>(0);
  const attemptsRef = useRef<number>(0);

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
        JSON.stringify({ rangeId, clef, keySigId, difficulty, showHints })
      );
    } catch {
      // ignore
    }
  }, [rangeId, clef, keySigId, difficulty, showHints]);

  // Clear any flash timer on unmount
  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

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
    setFeedback({ type: "neutral", text: "What note is this?" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeId, difficulty, keySigId]);

  const next = (avoidMidi?: number): void => {
    const midiToAvoid = avoidMidi ?? current.midi;
    setCurrent(pickNextNote(midiToAvoid));
    setFeedback({ type: "neutral", text: "What note is this?" });
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
      setFeedback({ type: "good", text: `✅ Correct: ${noteLabel(current)}` });
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
        text: `❌ Nope — it was ${noteLabel(current)} (you played ${noteLabel(your)})` 
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

    window.setTimeout(() => next(current.midi), 700);
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
    setFeedback({ type: "neutral", text: "Stats cleared. What note is this?" });
    next();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <div className="mx-auto w-full max-w-none px-4 py-4 sm:px-6 sm:py-6">
        <div className="rounded-3xl bg-slate-900/70 p-4 shadow-2xl ring-1 ring-white/10 sm:p-6">
          <header className="mb-4 sm:mb-5">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              ReadNote: Piano Sight-Reading Trainer
              <span className="ml-2 text-xs font-normal text-slate-400 sm:ml-3 sm:text-sm">v{APP_VERSION}</span>
            </h1>
            <p className="mt-1 text-sm text-slate-300 sm:text-base">
              Active trainer for rapid note recognition. Play the note on the on-screen piano; instant feedback keeps you moving.
            </p>
          </header>

          <div className="flex flex-col gap-4 sm:gap-6 lg:grid lg:grid-cols-[1fr_360px]">
            <div className="rounded-2xl bg-slate-950/40 p-4 shadow-lg ring-1 ring-white/10 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <ScoreBoard
                    score={score}
                    streak={streak}
                    feedback={feedback}
                    notesPerMinute={notesPerMinute}
                    attempts={attempts}
                  />
                </div>
                <button
                  onClick={handleResetStats}
                  className="self-start rounded-xl bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-100 ring-1 ring-rose-400/30 transition hover:bg-rose-500/30"
                >
                  Reset stats
                </button>
              </div>

              <StaveDisplay
                note={current}
                clef={clef}
                keySig={keySig}
                flashState={flashState}
              />

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => next()}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 ring-1 ring-white/10 hover:bg-white/15"
                >
                  Next
                </button>

                <button
                  onClick={async () => {
                    await ensureAudioStarted();
                    playMidi(current.midi);
                  }}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 ring-1 ring-white/10 hover:bg-white/15"
                >
                  Play note
                </button>
              </div>

              <PianoKeyboard
                minMidi={range.minMidi}
                maxMidi={range.maxMidi}
                currentNote={current}
                includeAccidentals={includeAccidentals}
                midiChoices={midiChoices}
                keySigPref={keySig.pref}
                showHints={showHints}
                flashMidi={flashMidi}
                flashState={flashState}
                onKeyPress={(midi) => void submitMidi(midi)}
              />

              {sessionSummary ? (
                <div className="mt-4 rounded-2xl bg-emerald-500/10 p-4 ring-1 ring-emerald-400/30">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-emerald-100">Session Summary</div>
                      <div className="text-xs text-emerald-200/80">
                        After {sessionSummary.correct} correct notes
                      </div>
                    </div>
                    <button
                      onClick={() => setSessionSummary(null)}
                      className="rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-400/30 hover:bg-emerald-500/30"
                    >
                      Continue
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-emerald-50 sm:grid-cols-3">
                    <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                      <div className="text-xs text-emerald-200/80">Avg NPM</div>
                      <div className="text-lg font-semibold">{sessionSummary.avgNpm}</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                      <div className="text-xs text-emerald-200/80">Accuracy</div>
                      <div className="text-lg font-semibold">{sessionSummary.accuracy}%</div>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                      <div className="text-xs text-emerald-200/80">Attempts</div>
                      <div className="text-lg font-semibold">{sessionSummary.attempts}</div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 space-y-3 rounded-2xl bg-slate-900/50 p-3 ring-1 ring-white/10">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Memory aids</div>
                    <div className="text-xs text-slate-400">Quick mnemonics for both clefs.</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div className="rounded-lg bg-blue-500/10 p-2 ring-1 ring-blue-400/20">
                    <div className="font-semibold text-blue-100 text-sm">Treble lines (EGBDF)</div>
                    <div className="text-blue-200/80">Every Good Boy Deserves Fruit</div>
                  </div>
                  <div className="rounded-lg bg-blue-500/10 p-2 ring-1 ring-blue-400/20">
                    <div className="font-semibold text-blue-100 text-sm">Treble spaces (FACE)</div>
                    <div className="text-blue-200/80">FACE spells FACE</div>
                  </div>
                  <div className="rounded-lg bg-blue-500/10 p-2 ring-1 ring-blue-400/20">
                    <div className="font-semibold text-blue-100 text-sm">Bass lines (GBDFA)</div>
                    <div className="text-blue-200/80">Good Burritos Don't Fall Apart</div>
                  </div>
                  <div className="rounded-lg bg-blue-500/10 p-2 ring-1 ring-blue-400/20">
                    <div className="font-semibold text-blue-100 text-sm">Bass spaces (ACEG)</div>
                    <div className="text-blue-200/80">All Cows Eat Grass</div>
                  </div>
                </div>

                <div className="rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300 ring-1 ring-white/10">
                  Weak notes are selected more often based on recent accuracy. Stats are stored locally in your browser.
                </div>
              </div>
            </div>

            <SettingsPanel
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
