import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";

function getTodayDateStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const ACTIVE_TIMEOUT_SECS = 300; // 5 minutes of inactivity stops tracking

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
  activeSeconds: number;
  isActiveTracking: boolean;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Stable ref to current user-id — usable inside long-lived closures/intervals
  const userIdRef = useRef(user?.id || "anon");
  userIdRef.current = user?.id || "anon";

  const [state, setState] = useState<TimerState>(() => {
    let breakThresholdMins = 120;
    try {
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
      totalElapsed: 0,
      breakThresholdMins,
    };
  });

  const [activeSeconds, setActiveSeconds] = useState<number>(0);
  const [isActiveTracking, setIsActiveTracking] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Debounce: track last time we posted to avoid hammering the API
  const lastPostMinRef = useRef<number>(-1);
  const postTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active tracking refs
  const lastActivityRef = useRef<number>(0);
  const activeDateRef = useRef(getTodayDateStr());
  const isActiveTrackingRef = useRef(false);
  const activeSecondsRef = useRef(activeSeconds);
  const totalElapsedRef = useRef(0);
  const lastPostActiveMinRef = useRef(-1);
  const scheduledActiveMinRef = useRef(-1);
  const activePostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs current on every render
  activeSecondsRef.current = activeSeconds;
  totalElapsedRef.current = state.totalElapsed;

  // Re-hydrate active seconds from user-scoped key once auth resolves
  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    const todayStr = getTodayDateStr();
    const stored = parseInt(localStorage.getItem(`active_total_${uid}_${todayStr}`) || "0", 10) || 0;
    if (stored > activeSecondsRef.current) {
      setActiveSeconds(stored);
      activeSecondsRef.current = stored;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const clearTick = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  // POST focus-log update (debounced, at most once per minute of Pomodoro elapsed)
  const syncFocusLog = (totalElapsedSecs: number) => {
    const mins = Math.floor(totalElapsedSecs / 60);
    if (mins === lastPostMinRef.current) return;
    if (postTimerRef.current) clearTimeout(postTimerRef.current);
    postTimerRef.current = setTimeout(() => {
      lastPostMinRef.current = mins;
      const activeMins = Math.floor(activeSecondsRef.current / 60);
      fetch("/api/manage/focus-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: getTodayDateStr(), minutes: mins, active_minutes: activeMins }),
      }).catch(() => {});
    }, 2000);
  };

  // POST active minutes when a new minute boundary is crossed (separate debounce)
  const syncActiveMins = (activeMins: number) => {
    if (activeMins === scheduledActiveMinRef.current || activeMins === lastPostActiveMinRef.current) return;
    scheduledActiveMinRef.current = activeMins;
    if (activePostTimerRef.current) clearTimeout(activePostTimerRef.current);
    activePostTimerRef.current = setTimeout(() => {
      lastPostActiveMinRef.current = activeMins;
      const pomMins = Math.floor(totalElapsedRef.current / 60);
      fetch("/api/manage/focus-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: getTodayDateStr(), minutes: pomMins, active_minutes: activeMins }),
      }).catch(() => {});
    }, 2000);
  };

  useEffect(() => {
    if (state.totalElapsed > 0) syncFocusLog(state.totalElapsed);
  }, [state.totalElapsed]);

  // Sync active minutes when minute boundary is crossed
  useEffect(() => {
    if (activeSeconds > 0) syncActiveMins(Math.floor(activeSeconds / 60));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSeconds]);

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

  // Passive activity tracker: attach listeners once on mount
  useEffect(() => {
    // Reset if date already changed since last load
    const todayStr = getTodayDateStr();
    if (activeDateRef.current !== todayStr) {
      activeDateRef.current = todayStr;
      setActiveSeconds(0);
    }

    const handleActivity = () => {
      const nowStr = getTodayDateStr();
      if (activeDateRef.current !== nowStr) {
        activeDateRef.current = nowStr;
        setActiveSeconds(0);
        activeSecondsRef.current = 0;
      }
      lastActivityRef.current = Date.now();
      if (!isActiveTrackingRef.current) {
        isActiveTrackingRef.current = true;
        setIsActiveTracking(true);
      }
    };

    document.addEventListener("mousemove", handleActivity, { passive: true });
    document.addEventListener("mousedown", handleActivity, { passive: true });
    document.addEventListener("keypress", handleActivity, { passive: true });
    document.addEventListener("scroll", handleActivity, { passive: true });
    document.addEventListener("touchstart", handleActivity, { passive: true });

    // Immediate sync — used for tab hide and page unload
    const syncNow = () => {
      const activeMins = Math.floor(activeSecondsRef.current / 60);
      const pomMins = Math.floor(totalElapsedRef.current / 60);
      if (activeMins === 0 && pomMins === 0) return;
      fetch("/api/manage/focus-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: getTodayDateStr(), minutes: pomMins, active_minutes: activeMins }),
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") syncNow();
    };

    const handleBeforeUnload = () => {
      const activeMins = Math.floor(activeSecondsRef.current / 60);
      const pomMins = Math.floor(totalElapsedRef.current / 60);
      if (activeMins === 0 && pomMins === 0) return;
      try {
        navigator.sendBeacon(
          "/api/manage/focus-log",
          new Blob(
            [JSON.stringify({ date: getTodayDateStr(), minutes: pomMins, active_minutes: activeMins })],
            { type: "application/json" }
          )
        );
      } catch { syncNow(); }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    const iv = setInterval(() => {
      const nowStr = getTodayDateStr();

      // Date rollover — reset counter for new day
      if (activeDateRef.current !== nowStr) {
        activeDateRef.current = nowStr;
        setActiveSeconds(0);
        isActiveTrackingRef.current = false;
        setIsActiveTracking(false);
        return;
      }

      // Stop counting after ACTIVE_TIMEOUT_SECS of inactivity
      const secsSinceActivity = lastActivityRef.current > 0
        ? (Date.now() - lastActivityRef.current) / 1000
        : Infinity;

      if (secsSinceActivity >= ACTIVE_TIMEOUT_SECS) {
        if (isActiveTrackingRef.current) {
          isActiveTrackingRef.current = false;
          setIsActiveTracking(false);
        }
        return;
      }

      // Increment active seconds and persist to user-scoped localStorage key
      setActiveSeconds((prev) => {
        const next = prev + 1;
        try { localStorage.setItem(`active_total_${userIdRef.current}_${nowStr}`, String(next)); } catch {}
        return next;
      });
    }, 1000);

    return () => {
      document.removeEventListener("mousemove", handleActivity);
      document.removeEventListener("mousedown", handleActivity);
      document.removeEventListener("keypress", handleActivity);
      document.removeEventListener("scroll", handleActivity);
      document.removeEventListener("touchstart", handleActivity);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(iv);
    };
  }, []);

  const setDuration = (mins: number) => {
    const secs = mins * 60;
    setState((p) => ({ ...p, duration: secs, remaining: secs, running: false, finished: false }));
  };

  const start = () => setState((p) => ({ ...p, running: true, finished: false }));
  const pause = () => setState((p) => ({ ...p, running: false }));

  const reset = () => {
    lastPostMinRef.current = -1;
    setState((p) => ({ ...p, remaining: p.duration, running: false, finished: false, cycles: 0, totalElapsed: 0 }));
  };

  const toggleLoopMode = () => setState((p) => ({ ...p, loopMode: !p.loopMode }));

  const setBreakThresholdMins = (mins: number) => {
    try { localStorage.setItem("pomodoro_break_threshold", String(mins)); } catch {}
    setState((p) => ({ ...p, breakThresholdMins: mins }));
  };

  return (
    <TimerContext.Provider value={{ ...state, setDuration, start, pause, reset, toggleLoopMode, setBreakThresholdMins, activeSeconds, isActiveTracking }}>
      {children}
    </TimerContext.Provider>
  );
}
