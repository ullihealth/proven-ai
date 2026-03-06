import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";

interface TimerState {
  duration: number;        // total seconds
  remaining: number;       // seconds left
  running: boolean;
  finished: boolean;
}

interface TimerContextValue extends TimerState {
  setDuration: (mins: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TimerState>({
    duration: 25 * 60,
    remaining: 25 * 60,
    running: false,
    finished: false,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const playChime = useCallback(() => {
    try {
      const ac = new AudioContext();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ac.currentTime);
      gain.gain.setValueAtTime(0.3, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.8);
      osc.connect(gain).connect(ac.destination);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + 0.8);
      // Second tone
      setTimeout(() => {
        const osc2 = ac.createOscillator();
        const g2 = ac.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1100, ac.currentTime);
        g2.gain.setValueAtTime(0.3, ac.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6);
        osc2.connect(g2).connect(ac.destination);
        osc2.start(ac.currentTime);
        osc2.stop(ac.currentTime + 0.6);
      }, 300);
    } catch {}
  }, []);

  useEffect(() => {
    if (!state.running) { clearTick(); return; }
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.remaining <= 1) {
          clearTick();
          playChime();
          return { ...prev, remaining: 0, running: false, finished: true };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return clearTick;
  }, [state.running, playChime]);

  const setDuration = (mins: number) => {
    const secs = mins * 60;
    setState({ duration: secs, remaining: secs, running: false, finished: false });
  };

  const start = () => setState((p) => ({ ...p, running: true, finished: false }));
  const pause = () => setState((p) => ({ ...p, running: false }));
  const reset = () => setState((p) => ({ ...p, remaining: p.duration, running: false, finished: false }));

  return (
    <TimerContext.Provider value={{ ...state, setDuration, start, pause, reset }}>
      {children}
    </TimerContext.Provider>
  );
}
