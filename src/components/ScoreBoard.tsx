import type { Feedback } from "../types";

interface ScoreBoardProps {
  score: number;
  streak: number;
  attempts: number;
  notesPerMinute: number;
  feedback: Feedback;
}

export function ScoreBoard({ score, streak, attempts, notesPerMinute, feedback }: ScoreBoardProps) {
  const pillClass =
    feedback.type === "good"
      ? "bg-emerald-500 text-white ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/50 font-semibold text-base"
      : feedback.type === "bad"
        ? "bg-rose-500 text-white ring-2 ring-rose-400 shadow-lg shadow-rose-500/50 font-semibold text-base"
        : "bg-slate-700 text-slate-200 ring-1 ring-slate-600";

  const accuracy = attempts === 0 ? 0 : Math.round((score / attempts) * 100);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200">
        Notes/min: <span className="font-semibold">{notesPerMinute.toFixed(1)}</span>
      </div>
      <div className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200">
        Streak: <span className="font-semibold">{streak}</span>
      </div>
      <div className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200">
        Accuracy: <span className="font-semibold">{accuracy}%</span>
      </div>
      <div className={`rounded-full px-4 py-1.5 text-sm transition-all duration-200 ${pillClass}`}>
        {feedback.text}
      </div>
    </div>
  );
}
