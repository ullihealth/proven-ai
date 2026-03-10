import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from "react";

function getTodayDateStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

interface TimerState {
  duration: number;
  remaining: number;
  running: boolean;
  finished: boolean;
  loopMode: boolean;
  cycles: number;
  totalElapsed: number;
  breakThresholdMins: number;
}

interface TimerContextValue extends TimerState {
  setDuration: (mins: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  toggleLoopMode: () => void;
  setBreakThresholdMins: (mins: number) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TimerState>(() => {
    let totalElapsed = 0;
    let breakThresholdMins = 120;
    try {
      const storedTotal = localStorage.getItem(`pomodoro_total_${getTodayDateStr()}`);
      if (storedTotal) totalElapsed = parseInt(storedTotal, 10) || 0;
      const storedThresh = localStorage.getItem("pomodoro_break_threshold");
      if (storedThresh) breakThresholdMins = parseInt(storedThresh, 10) || 120;
    } catch {}
    return {
      duration: 25 * 60,
      remaining: 25 * 60,
      running: false,
      finished: false,
      loopMode: true,
      cycles: 0,
      totalElapsed,
      breakThresholdMins,
    };
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  // Persist totalElapsed whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(`pomodoro_total_${getTodayDateStr()}`, String(state.totalElapsed));
    } catch {}
  }, [state.totalElapsed]);

  useEffect(() => {
    if (!state.running) { clearTick(); return; }
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.remaining <= 1) {
          const newTotal = prev.totalElapsed + prev.duration;
          if (prev.loopMode) {
            return { ...prev, remaining: prev.duration, running: true, finished: false, cycles: prev.cycles + 1, totalElapsed: newTotal };
          }
          clearTick();
          return { ...prev, remaining: 0, running: false, finished: true, cycles: prev.cycles + 1, totalElapsed: newTotal };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return clearTick;
  }, [state.running]);

  const setDuration = (mins: number) => {
    const secs = mins * 60;
    setState((p) => ({ ...p, duration: secs, remaining: secs, running: false, finished: false }));
  };

  const start = () => setState((p) => ({ ...p, running: true, finished: false }));
  const pause = () => setState((p) => ({ ...p, running: false }));

  const reset = () => {
    try { localStorage.setItem(`pomodoro_total_${getTodayDateStr()}`, "0"); } catch {}
    setState((p) => ({ ...p, remaining: p.duration, running: false, finished: false, cycles: 0, totalElapsed: 0 }));
  };

  const toggleLoopMode = () => setState((p) => ({ ...p, loopMode: !p.loopMode }));

  const setBreakThresholdMins = (mins: number) => {
    try { localStorage.setItem("pomodoro_break_threshold", String(mins)); } catch {}
    setState((p) => ({ ...p, breakThresholdMins: mins }));
  };

  return (
    <TimerContext.Provider value={{ ...state, setDuration, start, pause, reset, toggleLoopMode, setBreakThresholdMins }}>
      {children}
    </TimerContext.Provider>
  );
}
