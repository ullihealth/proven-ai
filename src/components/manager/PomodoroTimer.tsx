import { useState, useEffect } from "react";
import { useTimer } from "@/lib/manager/TimerContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Play, Pause, RotateCcw, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const RING_SIZE = 40;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ProgressRing({ progress, urgent, size = RING_SIZE, className }: { progress: number; urgent: boolean; size?: number; className?: string }) {
  const r = (size - RING_STROKE) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);
  return (
    <svg width={size} height={size} className={cn("transform -rotate-90", className)}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#30363d" strokeWidth={RING_STROKE} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={urgent ? "#e91e8c" : "#00bcd4"}
        strokeWidth={RING_STROKE} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-1000 linear"
      />
    </svg>
  );
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function TimerControls({ onClose }: { onClose?: () => void }) {
  const { duration, remaining, running, finished, setDuration, start, pause, reset } = useTimer();
  const mins = Math.round(duration / 60);
  const progress = duration > 0 ? remaining / duration : 0;
  const urgent = remaining <= 60 && remaining > 0;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {onClose && (
        <button onClick={onClose} className="absolute top-2 right-2 text-[#a0aab8] hover:text-[#e0e7ef]">
          <X className="h-4 w-4" />
        </button>
      )}
      <ProgressRing progress={progress} urgent={urgent} size={80} />
      <span className={cn("text-2xl font-mono font-bold", urgent ? "text-[#e91e8c]" : "text-[#00bcd4]")}>
        {formatTime(remaining)}
      </span>

      {/* Duration selector */}
      {!running && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDuration(Math.max(1, mins - 1))}
            className="w-8 h-8 rounded-md bg-[#242b35] text-[#a0aab8] hover:text-[#e0e7ef] flex items-center justify-center border border-[#30363d]"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="text-sm font-mono text-[#e0e7ef] w-16 text-center">{mins} min</span>
          <button
            onClick={() => setDuration(Math.min(90, mins + 1))}
            className="w-8 h-8 rounded-md bg-[#242b35] text-[#a0aab8] hover:text-[#e0e7ef] flex items-center justify-center border border-[#30363d]"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {running ? (
          <button onClick={pause} className="px-4 py-2 rounded-md bg-[#d29922]/20 text-[#d29922] text-sm font-semibold hover:bg-[#d29922]/30 transition-colors flex items-center gap-1.5">
            <Pause className="h-3.5 w-3.5" /> Pause
          </button>
        ) : (
          <button onClick={start} disabled={remaining === 0 && !finished} className="px-4 py-2 rounded-md bg-[#00bcd4]/20 text-[#00bcd4] text-sm font-semibold hover:bg-[#00bcd4]/30 transition-colors flex items-center gap-1.5 disabled:opacity-50">
            <Play className="h-3.5 w-3.5" /> Start
          </button>
        )}
        <button onClick={reset} className="px-4 py-2 rounded-md bg-[#242b35] text-[#a0aab8] text-sm font-semibold hover:text-[#e0e7ef] border border-[#30363d] transition-colors flex items-center gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>
    </div>
  );
}

export default function PomodoroTimer() {
  const { remaining, duration, running, finished } = useTimer();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const isMobile = useIsMobile();

  const progress = duration > 0 ? remaining / duration : 0;
  const urgent = remaining <= 60 && remaining > 0;

  // Flash on finish
  useEffect(() => {
    if (!finished) { setFlash(false); return; }
    setFlash(true);
    let count = 0;
    const iv = setInterval(() => {
      count++;
      setFlash((p) => !p);
      if (count >= 5) clearInterval(iv);
    }, 400);
    return () => clearInterval(iv);
  }, [finished]);

  // Mobile: collapsed ring + modal
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className={cn(
            "fixed z-50 rounded-full bg-[#161b22] border border-[#30363d] shadow-lg flex items-center justify-center transition-shadow",
            flash && "shadow-[0_0_16px_#e91e8c]"
          )}
          style={{ bottom: 90, right: 24, width: 40, height: 40 }}
        >
          <ProgressRing progress={progress} urgent={urgent || flash} size={36} />
          <span className="absolute text-[9px] font-mono font-bold text-[#e0e7ef]">
            {Math.ceil(remaining / 60)}
          </span>
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={() => setMobileOpen(false)}>
            <div className="w-full max-w-sm mb-4 mx-4 rounded-xl bg-[#161b22] border border-[#30363d] relative" onClick={(e) => e.stopPropagation()}>
              <TimerControls onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop: collapsed/expanded
  return (
    <div className="fixed z-50" style={{ bottom: 90, right: 24 }}>
      {expanded ? (
        <div className="rounded-xl bg-[#161b22] border border-[#30363d] shadow-lg relative min-w-[200px]">
          <TimerControls onClose={() => setExpanded(false)} />
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className={cn(
            "rounded-full bg-[#161b22] border border-[#30363d] shadow-lg flex items-center justify-center transition-shadow cursor-pointer",
            flash && "shadow-[0_0_16px_#e91e8c]"
          )}
          style={{ width: 40, height: 40 }}
        >
          <ProgressRing progress={progress} urgent={urgent || flash} size={36} />
          <span className="absolute text-[9px] font-mono font-bold text-[#e0e7ef]">
            {running || remaining < duration ? formatTime(remaining).replace(/^0/, "") : Math.ceil(remaining / 60).toString()}
          </span>
        </button>
      )}
    </div>
  );
}
