# 🎹 ReadNote

A focused **piano sight reading trainer** built with **React, TypeScript, Tailwind CSS, Next.js, VexFlow, and Tone.js**.

The goal is simple: **get faster at reading notes on the staff** — with a clean, distraction-free interface and optional note playback for ear training.

---

## ✨ Features

- 🎼 **Musical staff notation** rendered with VexFlow
- 🎹 **Interactive piano keyboard** with touch support
- 🔊 **Realistic piano audio** using Salamander Grand Piano samples
- 🧠 **Adaptive note selection** focuses on your weak notes
- 📊 **Session score and streak tracking**, with note accuracy saved locally
- 🎯 **Multiple difficulty levels** - beginner to advanced
- ⚙️ **Flexible settings** - ranges, clefs, key signatures
- 📱 **Web app manifest and icons** - install/offline support needs further verification
- 🎨 Clean, modern UI using **Tailwind CSS**

---

## 🧩 Tech Stack

- **React + TypeScript** — UI and state management
- **Next.js** — development server and static export
- **Tailwind CSS** — styling
- **VexFlow** — music notation rendering
- **Tone.js** — Web Audio (note playback)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.9+ (Next.js minimum); use a supported Node.js release
- npm (the repository includes a package lock)

### Install & Run

```bash
npm ci
npm run dev
```

Then open `http://localhost:3000/read-note-studio/`.

> ⚠️ Audio will only play **after your first interaction** (browser security restriction).

---

## Development checks and static export

```bash
npm run lint
npm run type-check
npm test -- --runInBand
npm run build
```

`app/` is the only routing directory. Shared application code and styles remain in `src/`. Type checking covers both, plus `next.config.ts` and the tests. Jest uses Next.js transforms and a simulated browser environment.

The build exports static files to `out/` with the `/read-note-studio` base path. There is no production Node.js server, so `next start` is not used. To preview the export with the correct path:

```bash
preview_dir="$(mktemp -d)"
ln -s "$PWD/out" "$preview_dir/read-note-studio"
python3 -m http.server 4173 --directory "$preview_dir"
```

Open `http://localhost:4173/read-note-studio/`. Stop the preview with Ctrl+C. The GitHub Pages workflow runs the checks before building and uploading `out/`.

## Local progress and settings

Note accuracy remains under `piano_flashcards_stats_v1`; settings remain under `readnote_studio_settings_v1`. Score, streak and session summaries are session-only. Existing valid records retain their values. Invalid fields fall back to defaults, while valid note records and settings remain usable.

Before replacing malformed or unrecognised stored data, the app saves its original text under the same key with a `_recovery` suffix, adding a number if necessary to preserve earlier copies. If that recovery copy cannot be written, the original is left untouched. Recovery copies are retained in browser storage; there is not yet an import/export interface. When storage is blocked or full, practice can continue, but new progress may not persist.

Progress belongs to the browser profile and site origin. Keep the same hosting origin to retain access to it. The existing Reset stats action still clears the active statistics immediately; separating session reset from saved-progress deletion is planned.

---

## 🧠 How It Works

1. A random note is generated within the selected range
2. The note is rendered on the staff
3. You answer by clicking the corresponding key on the piano
4. The clicked note is played back for ear training
5. Score and streak update automatically

Beginner practice uses notes belonging to the selected major key, including its sharps or flats. For example, G major includes F♯ rather than F natural. Presets retain their sounding-pitch boundaries, so the number of available notes can vary by key. Intermediate and Advanced currently both include all semitones within the range.

Written spelling follows the key, including E♯, B♯, C♭ and F♭. Written octave and sounding pitch are distinct: B♯3 sounds as C4. The staff relies on the key signature for in-key alterations and shows explicit accidentals, including natural signs, where needed. Each new question starts with a fresh accidental context. The red wrong-answer note uses the pitch actually played.

Piano labels follow the selected key; the middle-C dot remains an anchor for the physical C4 key. Existing note statistics remain indexed by sounding MIDI pitch, so an enharmonic spelling change does not discard progress.

This is intentionally **measure-free** notation — accuracy matters, not rhythm.

---

## 🔮 Suggested Future Features

### User Experience
- 🎓 **First-time user guidance** - Brief tutorial or tooltip overlay explaining how to use the app
- ⌨️ **Keyboard shortcuts** - Space bar for "Next", Enter to replay note, number keys 1-7 for white keys
- 📱 **Better mobile controls** - Larger touch targets, swipe gestures for next/previous
- 🎯 **Settings presets** - Quick buttons like "Learn Treble Clef" or "Practice Sharps/Flats"
- 💡 **Note name display** - Option to temporarily show the answer before moving to next

### Visual Feedback
- ✨ **Visual feedback on staff** - Highlight or animate the note on the staff when you click/play it
- 🎊 **Streak celebrations** - Confetti or animation at milestone streaks (5, 10, 25, etc.)
- 🔊 **Sound effects** - Different audio cues (chime for correct, buzz for wrong)

### Practice Features
- 📊 **Progress tracking** - Show accuracy percentage, weak notes list, or a progress bar
- 🎮 **Practice modes** - Time challenge mode, or focus on specific weak notes
- 🎯 **Focused practice** - Practice mode that targets only your weakest notes

---

## 📜 License

MIT — use it, break it, improve it.

---

Built for practice, not perfection 🎶
