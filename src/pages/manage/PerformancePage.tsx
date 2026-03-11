import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTimer } from "@/lib/manager/TimerContext";
import { fetchBoards } from "@/lib/manager/managerApi";
import type { Board } from "@/lib/manager/types";
import {
  Bar, Line, Area, ComposedChart, XAxis, YAxis, Tooltip as RechartTooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Flame, Trophy, Star, Calendar, ChevronDown, ChevronRight as ChevronRightIcon, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
interface FocusEntry {
  date: string;
  minutes: number;
  active_minutes?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getTodayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatHours(h: number) {
  if (h === 0) return "0h";
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  if (mm === 0) return `${hh}h`;
  return `${hh}h ${mm}m`;
}

function shortDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(d)}/${parseInt(m)}`;
}

function rollingAvg(data: { date: string; hours: number }[], window: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < window - 1) return null;
    const slice = data.slice(i - window + 1, i + 1);
    return slice.reduce((s, x) => s + x.hours, 0) / window;
  });
}

function calcStreaks(focusMap: Record<string, number>) {
  const today = getTodayStr();
  // Generate all dates with logged time
  const datesWithTime = Object.entries(focusMap)
    .filter(([, h]) => h > 0)
    .map(([d]) => d)
    .sort();

  if (datesWithTime.length === 0) return { current: 0, longest: 0 };

  // Longest streak
  let longest = 1;
  let run = 1;
  for (let i = 1; i < datesWithTime.length; i++) {
    const prev = datesWithTime[i - 1];
    const curr = datesWithTime[i];
    if (addDays(prev, 1) === curr) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // Current streak (count back from today)
  let current = 0;
  let check = today;
  while (focusMap[check] && focusMap[check] > 0) {
    current++;
    check = addDays(check, -1);
  }

  return { current, longest: Math.max(longest, current) };
}

function bestWeek(focusMap: Record<string, number>): number {
  const dates = Object.keys(focusMap).sort();
  if (dates.length === 0) return 0;
  let best = 0;
  for (let i = 0; i < dates.length; i++) {
    let week = 0;
    for (let j = i; j < dates.length && j < i + 7; j++) {
      week += focusMap[dates[j]] || 0;
    }
    if (week > best) best = week;
  }
  return best;
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────
function heatColour(h: number): string {
  if (h === 0) return "#1c2128";
  if (h < 2) return "#0d4f4f";
  if (h < 4) return "#00897b";
  if (h < 6) return "#00bcd4";
  return "#e91e8c";
}

function AnnualHeatmap({
  focusMap,
  activeMap,
  mode,
}: {
  focusMap: Record<string, number>;
  activeMap: Record<string, number>;
  mode: "focus" | "active";
}) {
  const dataMap = mode === "active" ? activeMap : focusMap;
  const today = getTodayStr();
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Build 52-week grid ending today
  const todayDate = new Date(today);
  const dayOfWeek = todayDate.getDay(); // 0=Sun
  // End of last complete week (Sunday)
  const gridEndDate = new Date(todayDate);
  gridEndDate.setDate(gridEndDate.getDate() + (6 - dayOfWeek));
  const gridStartDate = new Date(gridEndDate);
  gridStartDate.setDate(gridStartDate.getDate() - 52 * 7 + 1);

  const weeks: string[][] = [];
  let current = new Date(gridStartDate);
  while (current <= gridEndDate) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  // Month labels
  const monthLabels: { col: number; label: string }[] = [];
  weeks.forEach((week, i) => {
    const firstOfWeek = week[0];
    const d = new Date(firstOfWeek);
    if (d.getDate() <= 7) {
      monthLabels.push({ col: i, label: d.toLocaleString("default", { month: "short" }) });
    }
  });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Month labels */}
        <div className="flex mb-1" style={{ paddingLeft: 24 }}>
          {weeks.map((_, i) => {
            const ml = monthLabels.find((m) => m.col === i);
            return <div key={i} className="flex-shrink-0 text-[10px] text-[var(--text-muted)]" style={{ width: 13 }}>{ml?.label ?? ""}</div>;
          })}
        </div>
        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1 flex-shrink-0">
            {["", "Mon", "", "Wed", "", "Fri", ""].map((l, i) => (
              <div key={i} className="text-[9px] text-[var(--text-muted)] leading-none h-[11px] flex items-center">{l}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((dateStr) => {
                const h = dataMap[dateStr] ?? 0;
                const isFuture = dateStr > today;
                const isToday = dateStr === today;
                return (
                  <div
                    key={dateStr}
                    onMouseEnter={() => setHoveredDate(dateStr)}
                    onMouseLeave={() => setHoveredDate(null)}
                    className={cn(
                      "w-[11px] h-[11px] rounded-[2px] relative transition-opacity",
                      isFuture ? "opacity-20" : "cursor-pointer hover:opacity-80",
                      isToday && "ring-1 ring-white ring-offset-[1px] ring-offset-[#13181f]"
                    )}
                    style={{ backgroundColor: isFuture ? "#1c2128" : heatColour(h) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[var(--text-muted)]">
          <span>Less</span>
          {[0, 1, 2, 4, 6].map((h) => (
            <div key={h} className="w-[11px] h-[11px] rounded-[2px]" style={{ backgroundColor: heatColour(h) }} />
          ))}
          <span>More</span>
        </div>
        {/* Tooltip */}
        {hoveredDate && (
          <div className="mt-1 text-[11px] text-[var(--text-primary)]">
            {hoveredDate} — {mode === "active" ? "Active: " : ""}{formatHours(dataMap[hoveredDate] ?? 0)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card Activity Heatmap ────────────────────────────────────────────────────
interface CardActivitySummary { date: string; count: number; }
interface CardActivityEvent { card_id: string; card_title: string; board_name: string; event_type: string; }

function cardActivityColour(n: number): string {
  if (n === 0) return "#1c2128";
  if (n <= 2) return "#1a3a5c";
  if (n <= 5) return "#1565c0";
  if (n <= 10) return "#00bcd4";
  return "#e91e8c";
}

function CardActivityHeatmap({ activityMap }: { activityMap: Record<string, number> }) {
  const today = getTodayStr();
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [tooltipEvents, setTooltipEvents] = useState<CardActivityEvent[] | null>(null);
  const tooltipRef = useRef<string | null>(null);

  const handleHover = (dateStr: string) => {
    setHoveredDate(dateStr);
    if (activityMap[dateStr] > 0) {
      tooltipRef.current = dateStr;
      fetch(`/api/manage/card-activity?date=${dateStr}`)
        .then((r) => r.json())
        .then((d: { events: CardActivityEvent[] }) => {
          if (tooltipRef.current === dateStr) setTooltipEvents(d.events ?? []);
        })
        .catch(() => {});
    } else {
      setTooltipEvents(null);
    }
  };

  const handleLeave = () => {
    setHoveredDate(null);
    setTooltipEvents(null);
    tooltipRef.current = null;
  };

  // Build 52-week grid
  const todayDate = new Date(today);
  const dayOfWeek = todayDate.getDay();
  const gridEndDate = new Date(todayDate);
  gridEndDate.setDate(gridEndDate.getDate() + (6 - dayOfWeek));
  const gridStartDate = new Date(gridEndDate);
  gridStartDate.setDate(gridStartDate.getDate() - 52 * 7 + 1);

  const weeks: string[][] = [];
  const cur = new Date(gridStartDate);
  while (cur <= gridEndDate) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  const monthLabels: { col: number; label: string }[] = [];
  weeks.forEach((week, i) => {
    const d = new Date(week[0]);
    if (d.getDate() <= 7) {
      monthLabels.push({ col: i, label: d.toLocaleString("default", { month: "short" }) });
    }
  });

  // Top 3 cards from tooltip events
  const top3 = tooltipEvents
    ? Object.entries(
        tooltipEvents.reduce<Record<string, number>>((acc, e) => {
          acc[e.card_title] = (acc[e.card_title] || 0) + 1;
          return acc;
        }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
    : [];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        <div className="flex mb-1" style={{ paddingLeft: 24 }}>
          {weeks.map((_, i) => {
            const ml = monthLabels.find((m) => m.col === i);
            return <div key={i} className="flex-shrink-0 text-[10px] text-[var(--text-muted)]" style={{ width: 13 }}>{ml?.label ?? ""}</div>;
          })}
        </div>
        <div className="flex gap-0.5">
          <div className="flex flex-col gap-0.5 mr-1 flex-shrink-0">
            {["", "Mon", "", "Wed", "", "Fri", ""].map((l, i) => (
              <div key={i} className="text-[9px] text-[var(--text-muted)] leading-none h-[11px] flex items-center">{l}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((dateStr) => {
                const n = activityMap[dateStr] ?? 0;
                const isFuture = dateStr > today;
                const isToday = dateStr === today;
                return (
                  <div
                    key={dateStr}
                    onMouseEnter={() => handleHover(dateStr)}
                    onMouseLeave={handleLeave}
                    className={cn(
                      "w-[11px] h-[11px] rounded-[2px] relative transition-opacity",
                      isFuture ? "opacity-20" : "cursor-pointer hover:opacity-80",
                      isToday && "ring-1 ring-white ring-offset-[1px] ring-offset-[#13181f]"
                    )}
                    style={{ backgroundColor: isFuture ? "#1c2128" : cardActivityColour(n) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[var(--text-muted)]">
          <span>Less</span>
          {[0, 1, 3, 6, 11].map((n) => (
            <div key={n} className="w-[11px] h-[11px] rounded-[2px]" style={{ backgroundColor: cardActivityColour(n) }} />
          ))}
          <span>More</span>
        </div>
        {hoveredDate && (
          <div className="mt-1 text-[11px] text-[var(--text-primary)]">
            <span className="font-mono">{hoveredDate}</span>
            {" — "}
            <span>{activityMap[hoveredDate] ?? 0} event{(activityMap[hoveredDate] ?? 0) !== 1 ? "s" : ""}</span>
            {top3.length > 0 && (
              <span className="text-[var(--text-muted)] ml-2">
                · {top3.map(([title, count]) => `${title} (${count})`).join(", ")}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">{icon}{label}</div>
      <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
      {sub && <div className="text-xs text-[var(--text-muted)]">{sub}</div>}
    </div>
  );
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md px-3 py-2 text-xs text-[var(--text-primary)] shadow-xl space-y-1">
      <div className="font-semibold">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === "number" ? formatHours(p.value) : p.value}</div>
      ))}
    </div>
  );
}

// ─── Card time types ──────────────────────────────────────────────────────────
interface CardTimeSummaryEntry {
  board_id: string;
  board_name: string;
  card_id: string;
  card_title: string;
  total_seconds: number;
}

type CardTimePeriod = "day" | "week" | "month" | "year";

function getPeriodRange(period: CardTimePeriod, offset: number): { from: string; to: string; label: string } {
  const today = getTodayStr();
  const todayDate = new Date(today + "T00:00:00");
  if (period === "day") {
    const d = addDays(today, offset);
    return {
      from: d, to: d,
      label: new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    };
  }
  if (period === "week") {
    const dow = todayDate.getDay();
    const mon = addDays(today, (dow === 0 ? -6 : 1 - dow) + offset * 7);
    const sun = addDays(mon, 6);
    const fl = new Date(mon + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const tl = new Date(sun + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return { from: mon, to: sun, label: `${fl} – ${tl}` };
  }
  if (period === "month") {
    const d = new Date(today + "T00:00:00");
    d.setDate(1);
    d.setMonth(d.getMonth() + offset);
    const y = d.getFullYear(), m = d.getMonth();
    const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const to = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { from, to, label: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) };
  }
  const yr = new Date().getFullYear() + offset;
  return { from: `${yr}-01-01`, to: `${yr}-12-31`, label: String(yr) };
}

// ─── Section drag-to-reorder ──────────────────────────────────────────────────
type SectionId = "stats" | "goal" | "focus-chart" | "card-time" | "card-activity" | "heatmap";
const DEFAULT_SECTION_ORDER: SectionId[] = ["stats", "goal", "focus-chart", "card-time", "card-activity", "heatmap"];

function useSectionOrder() {
  const [order, setOrder] = useState<SectionId[]>(() => {
    try {
      const s = localStorage.getItem("perf_section_order");
      if (s) {
        const arr = JSON.parse(s) as SectionId[];
        // Ensure all sections present (handles new sections added after first save)
        const merged = [...arr.filter((id) => DEFAULT_SECTION_ORDER.includes(id))];
        for (const id of DEFAULT_SECTION_ORDER) { if (!merged.includes(id)) merged.push(id); }
        return merged;
      }
    } catch {}
    return DEFAULT_SECTION_ORDER;
  });

  const persist = useCallback((next: SectionId[]) => {
    setOrder(next);
    try { localStorage.setItem("perf_section_order", JSON.stringify(next)); } catch {}
  }, []);

  const dragStateRef = useRef<{ dragId: SectionId | null; overId: SectionId | null }>({ dragId: null, overId: null });
  const [draggingId, setDraggingId] = useState<SectionId | null>(null);
  const [overId, setOverId] = useState<SectionId | null>(null);

  function onDragStart(id: SectionId) {
    dragStateRef.current.dragId = id;
    setDraggingId(id);
  }
  function onDragOver(id: SectionId) {
    if (dragStateRef.current.dragId === id) return;
    dragStateRef.current.overId = id;
    setOverId(id);
  }
  function onDrop() {
    const { dragId, overId: overI } = dragStateRef.current;
    if (dragId && overI && dragId !== overI) {
      setOrder((prev) => {
        const next = [...prev];
        const fi = next.indexOf(dragId);
        const ti = next.indexOf(overI);
        next.splice(fi, 1);
        next.splice(ti, 0, dragId);
        try { localStorage.setItem("perf_section_order", JSON.stringify(next)); } catch {}
        return next;
      });
    }
    dragStateRef.current = { dragId: null, overId: null };
    setDraggingId(null);
    setOverId(null);
  }

  return { order, persist, draggingId, overId, onDragStart, onDragOver, onDrop };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type ViewMode = "day" | "week" | "month" | "year";

export default function PerformancePage() {
  const [focusMap, setFocusMap] = useState<Record<string, number>>({});
  const [activeMap, setActiveMap] = useState<Record<string, number>>({});
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const [cardTimeSummary, setCardTimeSummary] = useState<CardTimeSummaryEntry[]>([]);
  const [expandedBoards, setExpandedBoards] = useState<Record<string, boolean>>({});
  const [boardColorMap, setBoardColorMap] = useState<Record<string, string>>({});
  const [boardsList, setBoardsList] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("week");
  const [heatmapMode, setHeatmapMode] = useState<"focus" | "active">("focus");
  const [ctPeriod, setCtPeriod] = useState<CardTimePeriod>("week");
  const [ctOffset, setCtOffset] = useState(0);
  const { order: sectionOrder, draggingId: secDragging, overId: secOver, onDragStart: secDragStart, onDragOver: secDragOver, onDrop: secDrop } = useSectionOrder();
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    try { return parseFloat(localStorage.getItem("perf_daily_goal") || "6") || 6; } catch { return 6; }
  });

  useEffect(() => {
    fetch("/api/manage/focus-log")
      .then((r) => r.json())
      .then((d: { entries: FocusEntry[] }) => {
        const map: Record<string, number> = {};
        const amap: Record<string, number> = {};
        for (const e of d.entries ?? []) {
          if (e.minutes > 0) map[e.date] = e.minutes / 60;
          if ((e.active_minutes ?? 0) > 0) amap[e.date] = (e.active_minutes ?? 0) / 60;
        }
        setFocusMap(map);
        setActiveMap(amap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/manage/card-activity?summary=true")
      .then((r) => r.json())
      .then((d: { summary: CardActivitySummary[] }) => {
        const map: Record<string, number> = {};
        for (const s of d.summary ?? []) map[s.date] = s.count;
        setActivityMap(map);
      })
      .catch(() => {});

    fetchBoards()
      .then((d) => {
        const sorted = (d.boards ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
        setBoardsList(sorted);
        const map: Record<string, string> = {};
        for (const b of sorted) {
          if (b.color) map[b.id] = b.color;
        }
        setBoardColorMap(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const { from, to } = getPeriodRange(ctPeriod, ctOffset);
    fetch(`/api/manage/card-time-log?summary=true&from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d: { summary: CardTimeSummaryEntry[] }) => {
        setCardTimeSummary(d.summary ?? []);
      })
      .catch(() => {});
  }, [ctPeriod, ctOffset]);

  const today = getTodayStr();
  const { activeSeconds: liveActiveSeconds } = useTimer();
  const { current: currentStreak, longest: longestStreak } = useMemo(() => calcStreaks(focusMap), [focusMap]);
  const bestDay = useMemo(() => Math.max(0, ...Object.values(focusMap)), [focusMap]);
  const bestWeekHours = useMemo(() => bestWeek(focusMap), [focusMap]);
  const todayHours = focusMap[today] ?? 0;
  // Use live context value for today's active time (always ≥ API stored value)
  const todayActiveHours = Math.max(liveActiveSeconds / 3600, activeMap[today] ?? 0);
  const todayFocusPct = Math.min(100, (todayHours / dailyGoal) * 100);
  const todayActivePct = Math.min(100, (todayActiveHours / dailyGoal) * 100);
  const avgActive7 = useMemo(() => {
    let total = 0;
    for (let i = 0; i < 7; i++) total += activeMap[addDays(today, -i)] ?? 0;
    return total / 7;
  }, [activeMap, today]);

  // ── Chart data builders ──────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const makeRange = (n: number, step: "day" | "week" | "month"): { date: string; label: string; hours: number; activeHours: number }[] => {
      const result: { date: string; label: string; hours: number; activeHours: number }[] = [];
      if (step === "day") {
        for (let i = n - 1; i >= 0; i--) {
          const d = addDays(today, -i);
          result.push({ date: d, label: shortDate(d), hours: focusMap[d] ?? 0, activeHours: activeMap[d] ?? 0 });
        }
      } else if (step === "week") {
        for (let i = n - 1; i >= 0; i--) {
          const weekStart = addDays(today, -i * 7 - 6);
          let total = 0;
          let activeTotal = 0;
          for (let j = 0; j < 7; j++) {
            const dk = addDays(weekStart, j);
            total += focusMap[dk] ?? 0;
            activeTotal += activeMap[dk] ?? 0;
          }
          result.push({ date: weekStart, label: `W${shortDate(weekStart)}`, hours: total, activeHours: activeTotal });
        }
      } else {
        for (let i = n - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setMonth(d.getMonth() - i, 1);
          const monthStr = d.toISOString().slice(0, 7);
          let total = 0;
          let activeTotal = 0;
          const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
          for (let j = 1; j <= daysInMonth; j++) {
            const dk = `${monthStr}-${String(j).padStart(2, "0")}`;
            total += focusMap[dk] ?? 0;
            activeTotal += activeMap[dk] ?? 0;
          }
          result.push({ date: monthStr, label: d.toLocaleString("default", { month: "short" }), hours: total, activeHours: activeTotal });
        }
      }
      return result;
    };

    if (view === "day") return makeRange(30, "day");
    if (view === "week") return makeRange(12, "week");
    if (view === "month") return makeRange(12, "month");
    // year — all 52 weeks
    return makeRange(52, "week");
  }, [view, focusMap, activeMap, today]);

  const avg7 = useMemo(() => {
    // 7-point rolling avg on daily data regardless of view
    const daily: { date: string; hours: number }[] = [];
    for (let i = 364; i >= 0; i--) {
      const d = addDays(today, -i);
      daily.push({ date: d, hours: focusMap[d] ?? 0 });
    }
    const avgs = rollingAvg(daily, 7);
    // build a map
    const map: Record<string, number> = {};
    daily.forEach((d, i) => { if (avgs[i] !== null) map[d.date] = avgs[i] as number; });
    return map;
  }, [focusMap, today]);

  const avg30 = useMemo(() => {
    const daily: { date: string; hours: number }[] = [];
    for (let i = 364; i >= 0; i--) {
      const d = addDays(today, -i);
      daily.push({ date: d, hours: focusMap[d] ?? 0 });
    }
    const avgs = rollingAvg(daily, 30);
    const map: Record<string, number> = {};
    daily.forEach((d, i) => { if (avgs[i] !== null) map[d.date] = avgs[i] as number; });
    return map;
  }, [focusMap, today]);

  const chartDataWithAvg = useMemo(() => {
    return chartData.map((d) => ({
      ...d,
      avg7: avg7[d.date] != null ? parseFloat((avg7[d.date]).toFixed(2)) : undefined,
      avg30: avg30[d.date] != null ? parseFloat((avg30[d.date]).toFixed(2)) : undefined,
    }));
  }, [chartData, avg7, avg30]);

  const handleGoalChange = (val: number) => {
    const v = Math.max(0.5, Math.min(24, val));
    setDailyGoal(v);
    try { localStorage.setItem("perf_daily_goal", String(v)); } catch {}
  };

  const views: { key: ViewMode; label: string }[] = [
    { key: "day", label: "Day" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "year", label: "Year" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 pb-24 lg:p-8 lg:pb-24 space-y-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Performance</h1>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-[var(--text-muted)]">Loading...</div>
      ) : (
        <>
          {sectionOrder.map((sectionId) => {
            const dragHandle = (
              <div
                draggable
                onDragStart={(e) => { e.stopPropagation(); secDragStart(sectionId); }}
                onDragOver={(e) => { e.preventDefault(); secDragOver(sectionId); }}
                onDrop={(e) => { e.preventDefault(); secDrop(); }}
                className="cursor-grab active:cursor-grabbing p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
                title="Drag to reorder"
              >
                <GripVertical className="h-4 w-4" />
              </div>
            );
            const wrapSection = (content: React.ReactNode) => (
              <div
                key={sectionId}
                onDragOver={(e) => { e.preventDefault(); secDragOver(sectionId); }}
                onDrop={(e) => { e.preventDefault(); secDrop(); }}
                className={cn(
                  "transition-opacity",
                  secDragging === sectionId && "opacity-40",
                  secOver === sectionId && secDragging !== sectionId && "ring-2 ring-[#00bcd4]/50 rounded-lg"
                )}
              >
                {content}
              </div>
            );

            // ── stats ────────────────────────────────────────────────────────
            if (sectionId === "stats") return wrapSection(
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard icon={<Flame className="h-3.5 w-3.5 text-[#e91e8c]" />} label="Current streak" value={`${currentStreak}d`} sub={currentStreak === 1 ? "1 day" : `${currentStreak} consecutive days`} />
                <StatCard icon={<Trophy className="h-3.5 w-3.5 text-[#d29922]" />} label="Longest streak" value={`${longestStreak}d`} />
                <StatCard icon={<Star className="h-3.5 w-3.5 text-[#00bcd4]" />} label="Best single day" value={formatHours(bestDay)} />
                <StatCard icon={<Calendar className="h-3.5 w-3.5 text-[#3fb950]" />} label="Best week" value={formatHours(bestWeekHours)} />
                <StatCard icon={<span className="text-[#e91e8c] text-[10px]">&#9679;</span>} label="Active today" value={formatHours(todayActiveHours)} sub="Auto-tracked activity" />
                <StatCard icon={<span className="text-[#e91e8c] text-[10px]">&#9679;</span>} label="Avg active time (7d)" value={formatHours(avgActive7)} sub="Daily average" />
              </div>
            );

            // ── goal ─────────────────────────────────────────────────────────
            if (sectionId === "goal") return wrapSection(
              <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {dragHandle}
                    <span className="text-sm font-semibold text-[var(--text-primary)]">Today's focus goal</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--text-muted)]">Target:</span>
                    <input type="number" min={0.5} max={24} step={0.5} value={dailyGoal}
                      onChange={(e) => handleGoalChange(parseFloat(e.target.value) || 6)}
                      className="w-16 bg-[var(--bg-card)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#00bcd4] text-center" />
                    <span className="text-[var(--text-muted)]">h</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-[var(--bg-card)] rounded-full overflow-hidden relative">
                    <div className="absolute inset-y-0 left-0 rounded-full transition-all bg-[#22c55e]" style={{ width: `${todayActivePct}%` }} />
                    <div className="absolute inset-y-0 left-0 rounded-full transition-all bg-[#00bcd4]" style={{ width: `${todayFocusPct}%` }} />
                  </div>
                  <div className="text-xs text-right space-y-0.5 shrink-0">
                    <div><span className="font-mono text-[#00bcd4]">{formatHours(todayHours)}</span><span className="text-[var(--text-muted)]"> focus</span></div>
                    <div><span className="font-mono text-[#22c55e]">{formatHours(todayActiveHours)}</span><span className="text-[var(--text-muted)]"> active of {dailyGoal}h</span></div>
                  </div>
                </div>
              </div>
            );

            // ── focus-chart ───────────────────────────────────────────────────
            if (sectionId === "focus-chart") return wrapSection(
              <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg p-5 space-y-4">
                <div className="flex items-center gap-1">
                  {dragHandle}
                  <span className="text-sm font-semibold text-[var(--text-primary)] flex-1">Focus hours</span>
                  <div className="flex gap-1">
                    {views.map((v) => (
                      <button key={v.key} onClick={() => setView(v.key)}
                        className={cn("px-3 py-1 rounded text-xs font-medium transition-colors border",
                          view === v.key ? "bg-[#00bcd4]/20 text-[#00bcd4] border-[#00bcd4]/40" : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]")}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={chartDataWithAvg} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#a0aab8" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: "#a0aab8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                    <RechartTooltip content={(props) => <ChartTooltip {...props as Parameters<typeof ChartTooltip>[0]} />} />
                    <Area type="monotone" dataKey="activeHours" name="Active" fill="#e91e8c" stroke="#e91e8c" fillOpacity={0.12} strokeWidth={1.5} />
                    <Bar dataKey="hours" name="Focus" radius={[3, 3, 0, 0]}>
                      {chartDataWithAvg.map((entry) => (
                        <Cell key={entry.date} fill={entry.date === today || entry.date <= today ? "#00bcd4" : "#1c2128"} opacity={entry.date === today ? 1 : 0.6} />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="avg7" name="7-day avg" stroke="#d29922" dot={false} strokeWidth={1.5} connectNulls />
                    <Line type="monotone" dataKey="avg30" name="30-day avg" stroke="#888" dot={false} strokeWidth={1.5} connectNulls strokeDasharray="4 2" />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 bg-[#e91e8c] opacity-50 rounded-sm" /> Active time</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-[#d29922]" /> 7-day avg</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-[#888]" style={{ borderTop: "1px dashed #888" }} /> 30-day avg</span>
                </div>
              </div>
            );

            // ── card-time ─────────────────────────────────────────────────────
            if (sectionId === "card-time") {
              const timeByBoard: Record<string, { cards: CardTimeSummaryEntry[]; totalSeconds: number }> = {};
              for (const entry of cardTimeSummary) {
                if (!timeByBoard[entry.board_id]) timeByBoard[entry.board_id] = { cards: [], totalSeconds: 0 };
                timeByBoard[entry.board_id].cards.push(entry);
                timeByBoard[entry.board_id].totalSeconds += entry.total_seconds;
              }
              const boards = boardsList.map((b) => [
                b.id,
                { boardName: b.name, cards: timeByBoard[b.id]?.cards ?? [], totalSeconds: timeByBoard[b.id]?.totalSeconds ?? 0 },
              ] as [string, { boardName: string; cards: CardTimeSummaryEntry[]; totalSeconds: number }]);

              const fmtSecs = (s: number) => {
                const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
                if (h === 0) return `${m}m`; if (m === 0) return `${h}h`; return `${h}h ${m}m`;
              };
              const maxBoardSeconds = Math.max(1, ...boards.map(([, { totalSeconds }]) => totalSeconds));
              const top10 = [...cardTimeSummary].slice(0, 10);
              const rawMax = top10[0]?.total_seconds || 1;
              const scaleCap = rawMax <= 3600 ? 3600 : rawMax <= 4*3600 ? 4*3600 : rawMax <= 8*3600 ? 8*3600 : rawMax <= 12*3600 ? 12*3600 : 24*3600;
              const { label: periodLabel } = getPeriodRange(ctPeriod, ctOffset);
              const ctPeriods: { key: CardTimePeriod; label: string }[] = [
                { key: "day", label: "Day" }, { key: "week", label: "Week" },
                { key: "month", label: "Month" }, { key: "year", label: "Year" },
              ];

              return wrapSection(
                <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg p-5 space-y-4">
                  {/* Header row */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {dragHandle}
                    <span className="text-sm font-semibold text-[var(--text-primary)] flex-1">Card &amp; Board Time</span>
                    <div className="flex gap-0.5">
                      {ctPeriods.map((p) => (
                        <button key={p.key} onClick={() => { setCtPeriod(p.key); setCtOffset(0); }}
                          className={cn("px-2 py-1 rounded text-xs font-medium transition-colors border",
                            ctPeriod === p.key ? "bg-[#00bcd4]/20 text-[#00bcd4] border-[#00bcd4]/40" : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]")}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Period navigation */}
                  <div className="flex items-center gap-3">
                    <button onClick={() => setCtOffset((o) => o - 1)}
                      className="w-7 h-7 rounded flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-lg leading-none">‹</button>
                    <span className="text-xs text-[var(--text-primary)] flex-1 text-center">{periodLabel}</span>
                    <button onClick={() => setCtOffset((o) => o + 1)} disabled={ctOffset >= 0}
                      className="w-7 h-7 rounded flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed">›</button>
                  </div>

                  {/* Two-column layout: board list + top cards chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Board list */}
                    <div className="space-y-1">
                      {boards.map(([boardId, { boardName, cards, totalSeconds }]) => {
                        const isOpen = expandedBoards[boardId];
                        const bc = boardColorMap[boardId] || "#00bcd4";
                        const barPct = (totalSeconds / maxBoardSeconds) * 100;
                        return (
                          <div key={boardId}>
                            <button onClick={() => setExpandedBoards((prev) => ({ ...prev, [boardId]: !prev[boardId] }))}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[var(--bg-card)] transition-colors text-left">
                              {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" /> : <ChevronRightIcon className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />}
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: bc }} />
                              <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{boardName || boardId}</span>
                            </button>
                            <div className="ml-10 mr-3 mb-1 flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-[var(--bg-card)] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, backgroundColor: bc }} />
                              </div>
                              <span className="text-xs font-mono shrink-0 w-14 text-right" style={{ color: bc }}>{fmtSecs(totalSeconds)}</span>
                            </div>
                            {isOpen && (
                              <div className="ml-10 mt-0.5 space-y-0.5">
                                {cards.sort((a, b) => b.total_seconds - a.total_seconds).map((c) => (
                                  <div key={c.card_id} className="flex items-center gap-2 px-3 py-1.5">
                                    <span className="flex-1 text-xs text-[var(--text-muted)] truncate">{c.card_title}</span>
                                    <span className="text-xs font-mono text-[var(--text-primary)] shrink-0">{fmtSecs(c.total_seconds)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Top cards bar chart */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
                        <span>Top cards by time</span>
                        <span>/ {fmtSecs(scaleCap)}</span>
                      </div>
                      {top10.length === 0 && (
                        <p className="text-xs text-[var(--text-muted)]">No time logged in this period.</p>
                      )}
                      {top10.map((entry) => (
                        <div key={entry.card_id} className="flex items-center gap-2">
                          <div className="w-32 text-sm text-[var(--text-muted)] truncate shrink-0">{entry.card_title}</div>
                          <div className="flex-1 h-8 bg-[var(--bg-card)] rounded overflow-hidden">
                            <div className="h-full rounded transition-all" style={{ width: `${(entry.total_seconds / scaleCap) * 100}%`, backgroundColor: boardColorMap[entry.board_id] || "#00bcd4" }} />
                          </div>
                          <div className="text-sm font-medium font-mono shrink-0 w-16 text-right" style={{ color: boardColorMap[entry.board_id] || "#00bcd4" }}>{fmtSecs(entry.total_seconds)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            // ── card-activity ─────────────────────────────────────────────────
            if (sectionId === "card-activity") return wrapSection(
              <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg p-5 space-y-3">
                <div className="flex items-center gap-1">
                  {dragHandle}
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Card activity</span>
                </div>
                <CardActivityHeatmap activityMap={activityMap} />
              </div>
            );

            // ── heatmap ───────────────────────────────────────────────────────
            if (sectionId === "heatmap") return wrapSection(
              <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg p-5 space-y-3">
                <div className="flex items-center gap-1">
                  {dragHandle}
                  <span className="text-sm font-semibold text-[var(--text-primary)] flex-1">Annual heatmap</span>
                  <div className="flex gap-1">
                    {(["focus", "active"] as const).map((m) => (
                      <button key={m} onClick={() => setHeatmapMode(m)}
                        className={cn("px-3 py-1 rounded text-xs font-medium transition-colors border capitalize",
                          heatmapMode === m ? "bg-[#00bcd4]/20 text-[#00bcd4] border-[#00bcd4]/40" : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]")}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <AnnualHeatmap focusMap={focusMap} activeMap={activeMap} mode={heatmapMode} />
              </div>
            );

            return null;
          })}
        </>
      )}
    </div>
  );
}
