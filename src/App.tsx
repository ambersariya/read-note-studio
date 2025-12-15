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

const APP_VERSION = "1.2.0";
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
  const [feedback, setFeedback] = useState<Feedback>({ 
    type: "neutral", 
    text: "Click a key (or play MIDI) to answer." 
  });
  const [midiStatus, setMidiStatus] = useState<string>("MIDI: not connected");
  const midiCleanupRef = useRef<(() => void) | null>(null);

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

  function pickNextNote(): Note {
    const weights = midiChoices.map((m) => weightForMidi(stats, m));
    const midi = weightedPick(midiChoices, weights);
    return { midi, spelling: spellMidi(midi, keySig.pref) };
  }

  // When settings change, refresh the card
  useEffect(() => {
    const next = pickNextNote();
    setCurrent(next);
    setFeedback({ type: "neutral", text: "What note is this?" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeId, difficulty, keySigId]);

  const next = (): void => {
    setCurrent(pickNextNote());
    setFeedback({ type: "neutral", text: "What note is this?" });
  };

  const submitMidi = async (answerMidi: number): Promise<void> => {
    await ensureAudioStarted();

    const correct = answerMidi === current.midi;

    // Only play the clicked note
    playMidi(answerMidi);

    setStats((s) => updateStats(s, current.midi, correct));

    if (correct) {
      setScore((v) => v + 1);
      setStreak((v) => v + 1);
      setFeedback({ type: "good", text: `✅ Correct: ${noteLabel(current)}` });
    } else {
      setStreak(0);
      const your = { midi: answerMidi, spelling: spellMidi(answerMidi, keySig.pref) };
      setFeedback({ 
        type: "bad", 
        text: `❌ Nope — it was ${noteLabel(current)} (you played ${noteLabel(your)})` 
      });
    }

    window.setTimeout(() => next(), 700);
  };

  const connectMidi = async (): Promise<void> => {
    if (!navigator.requestMIDIAccess) {
      setMidiStatus("MIDI: not supported in this browser");
      return;
    }

    try {
      const access = await navigator.requestMIDIAccess();

      const attach = (): void => {
        const inputs = Array.from(access.inputs.values());
        if (inputs.length === 0) {
          setMidiStatus("MIDI: no input device found");
          return;
        }

        const input = inputs[0];
        setMidiStatus(`MIDI: connected (${input.name ?? "device"})`);

        const onMsg = (e: MIDIMessageEvent): void => {
          if (!e.data) return;
          const data = Array.from(e.data);
          const [status, note, velocity] = data;
          const cmd = status & 0xf0;
          const isNoteOn = cmd === 0x90 && velocity > 0;
          if (isNoteOn) {
            void submitMidi(note);
          }
        };

        input.onmidimessage = onMsg;

        midiCleanupRef.current = () => {
          input.onmidimessage = null;
        };
      };

      // attach now
      attach();

      // respond to hot-plug
      access.onstatechange = () => attach();
    } catch {
      setMidiStatus("MIDI: permission denied / unavailable");
    }
  };

  useEffect(() => {
    return () => {
      midiCleanupRef.current?.();
    };
  }, []);

  const handleResetStats = (): void => {
    setStats({});
    setScore(0);
    setStreak(0);
    setFeedback({ type: "neutral", text: "Stats cleared. What note is this?" });
    next();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Piano Note Flashcards
            <span className="ml-3 text-sm font-normal text-slate-400">v{APP_VERSION}</span>
          </h1>
          <p className="mt-1 text-slate-300">
            Identify notes on the stave. Click the on-screen piano or play a MIDI keyboard. Spaced repetition will
            surface weak notes more often.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl bg-slate-900/60 p-5 shadow-lg ring-1 ring-white/10">
            <ScoreBoard score={score} streak={streak} feedback={feedback} />

            <StaveDisplay note={current} clef={clef} keySig={keySig} />

            <div className="mt-4 flex flex-wrap items-center gap-3">
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

              <button
                onClick={() => void connectMidi()}
                className="rounded-xl bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-100 ring-1 ring-indigo-400/30 hover:bg-indigo-500/30"
              >
                Connect MIDI
              </button>

              <span className="text-xs text-slate-300">{midiStatus}</span>
            </div>

            <PianoKeyboard
              minMidi={range.minMidi}
              maxMidi={range.maxMidi}
              currentNote={current}
              includeAccidentals={includeAccidentals}
              midiChoices={midiChoices}
              keySigPref={keySig.pref}
              showHints={showHints}
              onKeyPress={(midi) => void submitMidi(midi)}
            />
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
            onResetStats={handleResetStats}
          />
        </div>
      </div>
    </div>
  );
}
