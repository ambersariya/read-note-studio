// --- Grand Piano Sound using Tonejs-Instruments samples ---
// Using a sampled grand piano for realistic sound

// Lazy load Tone.js only on the client side to avoid SSR issues
let Tone: typeof import("tone") | null = null;
let synth: import("tone").Sampler | null = null;
let isInitializing = false;
let samplesLoaded = false;
let thudSynth: import("tone").MembraneSynth | null = null;

async function initializeTone(): Promise<void> {
  // Skip initialization during SSR
  if (typeof window === "undefined") {
    return;
  }

  // Already initialized and samples loaded
  if (synth && samplesLoaded) {
    return;
  }

  // Wait if initialization is in progress
  if (isInitializing) {
    while (isInitializing && !samplesLoaded) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return;
  }

  isInitializing = true;

  try {
    // Dynamic import to ensure Tone.js is only loaded in the browser
    Tone = await import("tone");

    synth = new Tone.Sampler(
      {
        A0: "A0.mp3",
        C1: "C1.mp3",
        "D#1": "Ds1.mp3",
        "F#1": "Fs1.mp3",
        A1: "A1.mp3",
        C2: "C2.mp3",
        "D#2": "Ds2.mp3",
        "F#2": "Fs2.mp3",
        A2: "A2.mp3",
        C3: "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        A3: "A3.mp3",
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3",
        A5: "A5.mp3",
        C6: "C6.mp3",
        "D#6": "Ds6.mp3",
        "F#6": "Fs6.mp3",
        A6: "A6.mp3",
        C7: "C7.mp3",
        "D#7": "Ds7.mp3",
        "F#7": "Fs7.mp3",
        A7: "A7.mp3",
        C8: "C8.mp3",
      },
      {
        release: 1,
        baseUrl: "https://tonejs.github.io/audio/salamander/",
      }
    )
      .chain(
        new Tone.Reverb({ decay: 2, wet: 0.2 }),
        Tone.Destination
      );

    // Wait for all samples to be loaded
    await Tone.loaded();
    samplesLoaded = true;
  } finally {
    isInitializing = false;
  }
}

export async function ensureAudioStarted(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  await initializeTone();

  if (Tone && Tone.context.state !== "running") {
    await Tone.start();
  }
}

export function playMidi(midi: number): void {
  if (typeof window === "undefined" || !Tone || !synth || !samplesLoaded) {
    return;
  }

  try {
    const freq = Tone.Frequency(midi, "midi").toFrequency();

    // Release any currently playing note at this frequency first
    synth.triggerRelease(freq);

    // Then play the note with a short duration
    synth.triggerAttackRelease(freq, "0.3");
  } catch (error) {
    console.error("Error playing MIDI note:", error);
  }
}

function getThudSynth(): typeof thudSynth {
  if (!Tone) return null;
  if (!thudSynth) {
    thudSynth = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.12 },
    }).connect(Tone.Destination);
  }
  return thudSynth;
}

export async function playThud(): Promise<void> {
  if (!Tone) return;
  const synthInstance = getThudSynth();
  synthInstance?.triggerAttackRelease("C2", "16n", undefined, 0.16);
}
