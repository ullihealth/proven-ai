import { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from "react";

export interface ActiveCardTimer {
  cardId: string;
  cardTitle: string;
  boardId: string;
  boardName: string;
  startedAt: string;   // ISO-8601 timestamp of when counting started (or resumed)
  sessionStartedAt: string; // ISO-8601 timestamp of when this timer session began (for label)
  elapsedSeconds: number;
  isPaused: boolean;
}

interface CardTimerContextValue {
  activeCardTimer: ActiveCardTimer | null;
  startTimer: (card: { id: string; title: string }, boardId: string, boardName: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
}

const CardTimerContext = createContext<CardTimerContextValue | null>(null);

export function useCardTimer() {
  const ctx = useContext(CardTimerContext);
  if (!ctx) throw new Error("useCardTimer must be used within CardTimerProvider");
  return ctx;
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function saveTimerToApi(timer: ActiveCardTimer) {
  const endedAt = new Date().toISOString();
  const body = JSON.stringify({
    card_id: timer.cardId,
    card_title: timer.cardTitle,
    board_id: timer.boardId,
    board_name: timer.boardName,
    date: getTodayStr(),
    seconds: timer.elapsedSeconds,
    started_at: timer.sessionStartedAt,
    ended_at: endedAt,
  });

  // Use sendBeacon when available (unload events), otherwise fetch
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/manage/card-time-log", blob);
  } else {
    fetch("/api/manage/card-time-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(() => {});
  }
}

export function CardTimerProvider({ children }: { children: ReactNode }) {
  const [activeCardTimer, setActiveCardTimer] = useState<ActiveCardTimer | null>(null);

  // Keep a ref so interval callbacks and unload handlers can access latest state
  const timerRef = useRef<ActiveCardTimer | null>(null);
  timerRef.current = activeCardTimer;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTick = () => {
    clearTick();
    intervalRef.current = setInterval(() => {
      setActiveCardTimer((prev) => {
        if (!prev || prev.isPaused) return prev;
        return { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
      });
    }, 1000);
  };

  const startTimer = useCallback((
    card: { id: string; title: string },
    boardId: string,
    boardName: string
  ) => {
    // Save any currently-running timer first
    const current = timerRef.current;
    if (current && current.elapsedSeconds > 0) {
      saveTimerToApi(current);
    }

    const now = new Date().toISOString();
    const next: ActiveCardTimer = {
      cardId: card.id,
      cardTitle: card.title,
      boardId,
      boardName,
      startedAt: now,
      sessionStartedAt: now,
      elapsedSeconds: 0,
      isPaused: false,
    };
    setActiveCardTimer(next);
    timerRef.current = next;
    startTick();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pauseTimer = useCallback(() => {
    clearTick();
    setActiveCardTimer((prev) => prev ? { ...prev, isPaused: true } : prev);
  }, []);

  const resumeTimer = useCallback(() => {
    setActiveCardTimer((prev) => prev ? { ...prev, isPaused: false } : prev);
    startTick();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopTimer = useCallback(() => {
    clearTick();
    const current = timerRef.current;
    if (current && current.elapsedSeconds > 0) {
      saveTimerToApi(current);
    }
    setActiveCardTimer(null);
    timerRef.current = null;
  }, []);

  // Save on tab hide / page unload
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        const timer = timerRef.current;
        if (timer && !timer.isPaused && timer.elapsedSeconds > 0) {
          saveTimerToApi(timer);
          // Reset elapsed after saving so we don't double-count on resume
          const now = new Date().toISOString();
          const reset: ActiveCardTimer = { ...timer, elapsedSeconds: 0, sessionStartedAt: now, startedAt: now };
          setActiveCardTimer(reset);
          timerRef.current = reset;
        }
      }
    };

    const handleUnload = () => {
      const timer = timerRef.current;
      if (timer && timer.elapsedSeconds > 0) {
        saveTimerToApi(timer);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => () => clearTick(), []);

  return (
    <CardTimerContext.Provider value={{ activeCardTimer, startTimer, pauseTimer, resumeTimer, stopTimer }}>
      {children}
    </CardTimerContext.Provider>
  );
}
