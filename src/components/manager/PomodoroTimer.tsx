import { useState, useEffect, useRef } from "react";
import { useTimer } from "@/lib/manager/TimerContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Play, Pause, RotateCcw, Minus, Plus, X, Repeat, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

const RING_STROKE = 3;

// ─── Sound engine ────────────────────────────────────────────────────────────
type SoundOption = "bell" | "chime" | "ding" | "soft-alert" | "none";

function playSound(type: SoundOption) {
  if (type === "none") return;
  try {
    const ac = new AudioContext();
    const t = ac.currentTime;
    const play = (freq: number, start: number, dur: number, shape: OscillatorType = "sine", vol = 0.3) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = shape;
      osc.frequency.setValueAtTime(freq, t + start);
      gain.gain.setValueAtTime(vol, t + start);
      gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(t + start);
      osc.stop(t + start + dur);
    };
    if (type === "bell") {
      // Church bell — fundamental + rich harmonics
      play(440, 0, 1.5, "sine", 0.35);
      play(880, 0, 1.2, "sine", 0.15);
      play(1320, 0, 0.8, "sine", 0.08);
    } else if (type === "chime") {
      // Two ascending tones
      play(880, 0, 0.8);
      play(1100, 0.3, 0.6);
    } else if (type === "ding") {
      // Short bright ping
      play(1480, 0, 0.5, "triangle", 0.35);
      play(2960, 0, 0.25, "sine", 0.1);
    } else if (type === "soft-alert") {
      // Gentle pulse trio
      play(660, 0,   0.3, "sine", 0.2);
      play(660, 0.4, 0.3, "sine", 0.2);
      play(660, 0.8, 0.3, "sine", 0.2);
    }
  } catch {}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function formatElapsed(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── Ring ─────────────────────────────────────────────────────────────────────
function ProgressRing({ progress, urgent, size = 40, className }: { progress: number; urgent: boolean; size?: number; className?: string }) {
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

// ─── Sound selector ──────────────────────────────────────────────────────────
const SOUND_OPTIONS: { value: SoundOption; label: string }[] = [
  { value: "bell",       label: "Bell"       },
  { value: "chime",      label: "Chime"      },
  { value: "ding",       label: "Ding"       },
  { value: "soft-alert", label: "Soft Alert" },
  { value: "none",       label: "None"       },
];

function SoundSelect({ label, value, onChange }: { label: string; value: SoundOption; onChange: (v: SoundOption) => void }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
      <span className="w-[72px] shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e) => {
          const v = e.target.value as SoundOption;
          onChange(v);
          playSound(v);
        }}
        className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded px-1.5 py-1 text-[var(--text-primary)] text-xs focus:outline-none focus:border-[#00bcd4]"
      >
        {SOUND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── Break modal ─────────────────────────────────────────────────────────────
function BreakModal({
  elapsedSecs,
  onPause,
  onRemind,
  onIgnore,
}: {
  elapsedSecs: number;
  onPause: () => void;
  onRemind: () => void;
  onIgnore: () => void;
}) {
  const h = Math.floor(elapsedSecs / 3600);
  const m = Math.floor((elapsedSecs % 3600) / 60);
  const display = h > 0 ? `${h} hour${h !== 1 ? "s" : ""}${m > 0 ? ` ${m} minute${m !== 1 ? "s" : ""}` : ""}` : `${m} minute${m !== 1 ? "s" : ""}`;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
      <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 flex flex-col items-center gap-4">
        <Coffee className="h-10 w-10 text-[#d29922]" />
        <h2 className="text-lg font-bold text-[var(--text-primary)] text-center">Time for a break!</h2>
        <p className="text-sm text-[var(--text-muted)] text-center">
          You've been working for <span className="text-[var(--text-primary)] font-semibold">{display}</span>.
        </p>
        <div className="flex flex-col gap-2 w-full">
          <button onClick={onPause}
            className="w-full py-2 rounded-md bg-[#d29922]/20 text-[#d29922] text-sm font-semibold hover:bg-[#d29922]/30 transition-colors border border-[#d29922]/30">
            Pause Timer
          </button>
          <button onClick={onRemind}
            className="w-full py-2 rounded-md bg-[var(--bg-elevated)] text-[var(--text-muted)] text-sm font-semibold hover:text-[var(--text-primary)] border border-[var(--border)] transition-colors">
            Remind in 10 min
          </button>
          <button onClick={onIgnore}
            className="w-full py-2 rounded-md bg-[var(--bg-elevated)] text-[var(--text-muted)] text-sm font-semibold hover:text-[var(--text-primary)] border border-[var(--border)] transition-colors">
            Ignore
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Timer controls panel ─────────────────────────────────────────────────────
function TimerControls({ onClose }: { onClose?: () => void }) {
  const {
    duration, remaining, running, finished, loopMode, cycles, totalElapsed,
    breakThresholdMins, setDuration, start, pause, reset, toggleLoopMode, setBreakThresholdMins,
  } = useTimer();

  const [loopSound, setLoopSound] = useState<SoundOption>(() => {
    try { return (localStorage.getItem("pomodoro_loop_sound") as SoundOption) || "chime"; } catch { return "chime"; }
  });
  const [breakSound, setBreakSound] = useState<SoundOption>(() => {
    try { return (localStorage.getItem("pomodoro_break_sound") as SoundOption) || "bell"; } catch { return "bell"; }
  });
  const [showBreakModal, setShowBreakModal] = useState(false);

  // Track last cycle count to detect loop completion and check break threshold
  const prevCyclesRef = useRef(cycles);
  const breakRemindOffset = useRef(0); // extra seconds offset for "remind in 10 min"
  const ignoredThresholdRef = useRef(false);

  useEffect(() => {
    if (cycles > prevCyclesRef.current) {
      playSound(loopSound);
      prevCyclesRef.current = cycles;
    }
  }, [cycles, loopSound]);

  // Break reminder trigger
  useEffect(() => {
    const thresholdSecs = breakThresholdMins * 60 + breakRemindOffset.current;
    if (!ignoredThresholdRef.current && totalElapsed >= thresholdSecs && totalElapsed > 0 && !showBreakModal) {
      playSound(breakSound);
      setShowBreakModal(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalElapsed]);

  const handleLoopSoundChange = (v: SoundOption) => {
    setLoopSound(v);
    try { localStorage.setItem("pomodoro_loop_sound", v); } catch {}
  };
  const handleBreakSoundChange = (v: SoundOption) => {
    setBreakSound(v);
    try { localStorage.setItem("pomodoro_break_sound", v); } catch {}
  };

  const handlePauseFromModal = () => { pause(); setShowBreakModal(false); ignoredThresholdRef.current = false; breakRemindOffset.current = 0; };
  const handleRemind = () => { setShowBreakModal(false); ignoredThresholdRef.current = false; breakRemindOffset.current = totalElapsed + 600; };
  const handleIgnore = () => { setShowBreakModal(false); ignoredThresholdRef.current = true; };

  const mins = Math.round(duration / 60);
  const progress = duration > 0 ? remaining / duration : 0;
  const urgent = remaining <= 60 && remaining > 0;

  return (
    <>
      {showBreakModal && (
        <BreakModal
          elapsedSecs={totalElapsed}
          onPause={handlePauseFromModal}
          onRemind={handleRemind}
          onIgnore={handleIgnore}
        />
      )}
      <div className="flex flex-col items-center gap-3 p-4">
        {onClose && (
          <button onClick={onClose} className="absolute top-2 right-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="h-4 w-4" />
          </button>
        )}

        <ProgressRing progress={progress} urgent={urgent} size={80} />
        <span className={cn("text-2xl font-mono font-bold", urgent ? "text-[#e91e8c]" : "text-[#00bcd4]")}>
          {formatTime(remaining)}
        </span>

        {/* Total elapsed */}
        {totalElapsed > 0 && (
          <span className="text-[11px] font-mono text-[var(--text-muted)]">Total: {formatElapsed(totalElapsed)}</span>
        )}

        {/* Mode toggle */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={toggleLoopMode}
            className={cn(
              "px-3 py-1.5 rounded-md font-semibold transition-colors border",
              !loopMode ? "bg-[#00bcd4]/20 text-[#00bcd4] border-[#00bcd4]/40" : "bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]"
            )}
          >
            Single
          </button>
          <button
            onClick={toggleLoopMode}
            className={cn(
              "px-3 py-1.5 rounded-md font-semibold transition-colors border flex items-center gap-1",
              loopMode ? "bg-[#00bcd4]/20 text-[#00bcd4] border-[#00bcd4]/40" : "bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]"
            )}
          >
            <Repeat className="h-3 w-3" /> Loop
          </button>
        </div>

        {/* Cycle counter */}
        {loopMode && cycles > 0 && (
          <span className="text-xs font-mono text-[var(--text-muted)]">{cycles} cycle{cycles !== 1 ? "s" : ""}</span>
        )}

        {/* Duration selector */}
        {!running && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDuration(Math.max(1, mins - 1))}
              className="w-8 h-8 rounded-md bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center border border-[var(--border)]"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="text-sm font-mono text-[var(--text-primary)] w-16 text-center">{mins} min</span>
            <button
              onClick={() => setDuration(Math.min(90, mins + 1))}
              className="w-8 h-8 rounded-md bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center border border-[var(--border)]"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Break threshold */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] w-full justify-center">
          <span>Break at</span>
          <button
            onClick={() => setBreakThresholdMins(Math.max(15, breakThresholdMins - 15))}
            className="w-6 h-6 rounded bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:text-[var(--text-primary)]"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="font-mono text-[var(--text-primary)] w-[52px] text-center">
            {breakThresholdMins >= 60 ? `${breakThresholdMins / 60}h` : `${breakThresholdMins}m`}
            {breakThresholdMins % 60 !== 0 && breakThresholdMins > 60 ? ` ${breakThresholdMins % 60}m` : ""}
          </span>
          <button
            onClick={() => setBreakThresholdMins(Math.min(480, breakThresholdMins + 15))}
            className="w-6 h-6 rounded bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:text-[var(--text-primary)]"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

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
          <button onClick={reset} className="px-4 py-2 rounded-md bg-[var(--bg-elevated)] text-[var(--text-muted)] text-sm font-semibold hover:text-[var(--text-primary)] border border-[var(--border)] transition-colors flex items-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        {/* Sound selectors */}
        <div className="w-full pt-1 flex flex-col gap-2 border-t border-[var(--border)]">
          <SoundSelect label="Loop sound" value={loopSound} onChange={handleLoopSoundChange} />
          <SoundSelect label="Break sound" value={breakSound} onChange={handleBreakSoundChange} />
        </div>
      </div>
    </>
  );
}

export default function PomodoroTimer() {
  const { remaining, duration, running, finished, loopMode, cycles, totalElapsed } = useTimer();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const isMobile = useIsMobile();

  const progress = duration > 0 ? remaining / duration : 0;
  const urgent = remaining <= 60 && remaining > 0;

  // Flash on cycle complete (works for both modes)
  useEffect(() => {
    if (!finished && !(loopMode && cycles > 0)) return;
    if (loopMode && cycles > 0 && remaining === duration) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1200);
      return () => clearTimeout(t);
    }
    if (finished) {
      setFlash(true);
      let count = 0;
      const iv = setInterval(() => {
        count++;
        setFlash((p) => !p);
        if (count >= 5) clearInterval(iv);
      }, 400);
      return () => clearInterval(iv);
    }
  }, [finished, cycles]);

  // Mobile
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className={cn(
            "fixed z-50 rounded-full bg-[var(--bg-sidebar)] border border-[var(--border)] shadow-lg flex items-center justify-center transition-shadow",
            flash && "shadow-[0_0_16px_#e91e8c]"
          )}
          style={{ bottom: 90, right: 24, width: 40, height: 40 }}
        >
          <ProgressRing progress={progress} urgent={urgent || flash} size={36} />
          <span className="absolute text-[9px] font-mono font-bold text-[var(--text-primary)]">
            {Math.ceil(remaining / 60)}
          </span>
          {loopMode && <Repeat className="absolute -top-1 -right-1 h-3 w-3 text-[#00bcd4]" />}
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={() => setMobileOpen(false)}>
            <div className="w-full max-w-sm mb-4 mx-4 rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border)] relative" onClick={(e) => e.stopPropagation()}>
              <TimerControls onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop
  return (
    <div className="fixed z-50" style={{ bottom: 90, right: 24 }}>
      {expanded ? (
        <div className="rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border)] shadow-lg relative min-w-[220px]">
          <TimerControls onClose={() => setExpanded(false)} />
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className={cn(
            "rounded-full bg-[var(--bg-sidebar)] border border-[var(--border)] shadow-lg flex flex-col items-center justify-center transition-shadow cursor-pointer relative",
            flash && "shadow-[0_0_16px_#e91e8c]"
          )}
          style={{ width: 40, height: 40 }}
        >
          <ProgressRing progress={progress} urgent={urgent || flash} size={36} />
          <span className="absolute text-[9px] font-mono font-bold text-[var(--text-primary)]">
            {running || remaining < duration ? formatTime(remaining).replace(/^0/, "") : Math.ceil(remaining / 60).toString()}
          </span>
          {loopMode && <Repeat className="absolute -top-1 -right-1 h-3 w-3 text-[#00bcd4]" />}
          {totalElapsed > 0 && (
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-[var(--text-muted)] whitespace-nowrap">
              {formatElapsed(totalElapsed)}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
