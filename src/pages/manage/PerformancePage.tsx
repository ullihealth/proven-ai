import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, ComposedChart, XAxis, YAxis, Tooltip as RechartTooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Flame, Trophy, Star, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Note {
  id: string;
  date: string;
  title: string;
  content: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseFocusHours(content: string): number {
  const match = content.match(/Focus time logged:\s*(?:(\d+)\s*hours?\s*)?(?:(\d+)\s*minutes?)?/i);
  if (!match) return 0;
  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  return h + m / 60;
}

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

function AnnualHeatmap({ focusMap }: { focusMap: Record<string, number> }) {
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
                const h = focusMap[dateStr] ?? 0;
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
            {hoveredDate} — {formatHours(focusMap[hoveredDate] ?? 0)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
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

// ─── Page ─────────────────────────────────────────────────────────────────────
type ViewMode = "day" | "week" | "month" | "year";

export default function PerformancePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("week");
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    try { return parseFloat(localStorage.getItem("perf_daily_goal") || "6") || 6; } catch { return 6; }
  });

  useEffect(() => {
    fetch("/api/manage/notes")
      .then((r) => r.json())
      .then((d: { notes: Note[] }) => { setNotes(d.notes ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const focusMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const note of notes) {
      const h = parseFocusHours(note.content);
      if (h > 0) map[note.date] = h;
    }
    return map;
  }, [notes]);

  const today = getTodayStr();
  const { current: currentStreak, longest: longestStreak } = useMemo(() => calcStreaks(focusMap), [focusMap]);
  const bestDay = useMemo(() => Math.max(0, ...Object.values(focusMap)), [focusMap]);
  const bestWeekHours = useMemo(() => bestWeek(focusMap), [focusMap]);
  const todayHours = focusMap[today] ?? 0;
  const todayPct = Math.min(100, Math.round((todayHours / dailyGoal) * 100));

  // ── Chart data builders ──────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const makeRange = (n: number, step: "day" | "week" | "month"): { date: string; label: string; hours: number }[] => {
      const result: { date: string; label: string; hours: number }[] = [];
      if (step === "day") {
        for (let i = n - 1; i >= 0; i--) {
          const d = addDays(today, -i);
          result.push({ date: d, label: shortDate(d), hours: focusMap[d] ?? 0 });
        }
      } else if (step === "week") {
        for (let i = n - 1; i >= 0; i--) {
          const weekStart = addDays(today, -i * 7 - 6);
          let total = 0;
          for (let j = 0; j < 7; j++) total += focusMap[addDays(weekStart, j)] ?? 0;
          result.push({ date: weekStart, label: `W${shortDate(weekStart)}`, hours: total });
        }
      } else {
        for (let i = n - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setMonth(d.getMonth() - i, 1);
          const monthStr = d.toISOString().slice(0, 7);
          let total = 0;
          const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
          for (let j = 1; j <= daysInMonth; j++) {
            const dk = `${monthStr}-${String(j).padStart(2, "0")}`;
            total += focusMap[dk] ?? 0;
          }
          result.push({ date: monthStr, label: d.toLocaleString("default", { month: "short" }), hours: total });
        }
      }
      return result;
    };

    if (view === "day") return makeRange(30, "day");
    if (view === "week") return makeRange(12, "week");
    if (view === "month") return makeRange(12, "month");
    // year — all 52 weeks
    return makeRange(52, "week");
  }, [view, focusMap, today]);

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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 lg:p-8 space-y-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Performance</h1>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-[var(--text-muted)]">Loading...</div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Flame className="h-3.5 w-3.5 text-[#e91e8c]" />}
              label="Current streak"
              value={`${currentStreak}d`}
              sub={currentStreak === 1 ? "1 day" : `${currentStreak} consecutive days`}
            />
            <StatCard
              icon={<Trophy className="h-3.5 w-3.5 text-[#d29922]" />}
              label="Longest streak"
              value={`${longestStreak}d`}
            />
            <StatCard
              icon={<Star className="h-3.5 w-3.5 text-[#00bcd4]" />}
              label="Best single day"
              value={formatHours(bestDay)}
            />
            <StatCard
              icon={<Calendar className="h-3.5 w-3.5 text-[#3fb950]" />}
              label="Best week"
              value={formatHours(bestWeekHours)}
            />
          </div>

          {/* Daily goal */}
          <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Today's focus goal</span>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--text-muted)]">Target:</span>
                <input
                  type="number"
                  min={0.5}
                  max={24}
                  step={0.5}
                  value={dailyGoal}
                  onChange={(e) => handleGoalChange(parseFloat(e.target.value) || 6)}
                  className="w-16 bg-[var(--bg-card)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#00bcd4] text-center"
                />
                <span className="text-[var(--text-muted)]">h</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-[var(--bg-card)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00bcd4] rounded-full transition-all"
                  style={{ width: `${todayPct}%` }}
                />
              </div>
              <span className="text-sm font-mono text-[#00bcd4] w-20 text-right">
                {formatHours(todayHours)} / {dailyGoal}h ({todayPct}%)
              </span>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Focus hours</span>
              <div className="flex gap-1">
                {views.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setView(v.key)}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-medium transition-colors border",
                      view === v.key
                        ? "bg-[#00bcd4]/20 text-[#00bcd4] border-[#00bcd4]/40"
                        : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]"
                    )}
                  >
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
                <Bar dataKey="hours" name="Focus" radius={[3, 3, 0, 0]}>
                  {chartDataWithAvg.map((entry) => (
                    <Cell
                      key={entry.date}
                      fill={entry.date === today || entry.date <= today ? "#00bcd4" : "#1c2128"}
                      opacity={entry.date === today ? 1 : 0.6}
                    />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="avg7" name="7-day avg" stroke="#e91e8c" dot={false} strokeWidth={1.5} connectNulls />
                <Line type="monotone" dataKey="avg30" name="30-day avg" stroke="#d29922" dot={false} strokeWidth={1.5} connectNulls strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>

            <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-[#e91e8c]" /> 7-day avg</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-[#d29922]" style={{ borderTop: "1px dashed #d29922" }} /> 30-day avg</span>
            </div>
          </div>

          {/* Heatmap */}
          <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg p-5 space-y-3">
            <span className="text-sm font-semibold text-[var(--text-primary)]">Annual heatmap</span>
            <AnnualHeatmap focusMap={focusMap} />
          </div>
        </>
      )}
    </div>
  );
}
