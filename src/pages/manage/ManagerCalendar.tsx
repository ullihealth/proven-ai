import { useEffect, useRef, useState } from "react";
import { fetchAllCards, type Card } from "@/lib/manager";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const boardColors: Record<string, string> = {
  content: "#00bcd4",
  platform: "#e91e8c",
  funnel: "#d29922",
  bizdev: "#3fb950",
  strategy: "#8b949e",
};

export default function ManagerCalendar() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date());
  const [tooltip, setTooltip] = useState<{ title: string; x: number; y: number } | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchAllCards()
      .then((d) => setCards(d.cards.filter((c) => c.due_date)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const year = month.getFullYear();
  const mo = month.getMonth();
  const firstDay = new Date(year, mo, 1).getDay();
  const daysInMonth = new Date(year, mo + 1, 0).getDate();

  const prev = () => setMonth(new Date(year, mo - 1, 1));
  const next = () => setMonth(new Date(year, mo + 1, 1));

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00bcd4]" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-mono text-[#c9d1d9]">Calendar</h1>
        <div className="flex items-center gap-4">
          <button onClick={prev} className="text-[#8b949e] hover:text-[#c9d1d9]"><ChevronLeft className="h-5 w-5" /></button>
          <span className="text-sm font-mono text-[#c9d1d9]">
            {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button onClick={next} className="text-[#8b949e] hover:text-[#c9d1d9]"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-mono text-[#8b949e] py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-[#30363d] rounded-lg overflow-hidden">
        {cells.map((day, i) => {
          const dateStr = day ? `${year}-${String(mo + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
          const dayCards = cards.filter((c) => c.due_date === dateStr);
          const isToday = dateStr === new Date().toISOString().slice(0, 10);

          return (
            <div
              key={i}
              className={`min-h-[100px] p-2 bg-[#0d1117] ${day ? "" : "bg-[#161b22]"}`}
            >
              {day && (
                <>
                  <span className={`text-xs font-mono ${isToday ? "text-[#00bcd4] font-bold" : "text-[#8b949e]"}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayCards.slice(0, 3).map((card) => (
                      <div
                        key={card.id}
                        className="text-[10px] text-[#c9d1d9] truncate px-1 py-0.5 rounded"
                        style={{ backgroundColor: `${boardColors[card.board_id]}20`, borderLeft: `2px solid ${boardColors[card.board_id]}` }}
                        onMouseEnter={(e) => {
                          if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
                          const rect = e.currentTarget.getBoundingClientRect();
                          tooltipTimerRef.current = setTimeout(() => setTooltip({ title: card.title, x: rect.left + rect.width / 2, y: rect.top }), 400);
                        }}
                        onMouseLeave={() => {
                          if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
                          setTooltip(null);
                        }}
                      >
                        {card.title}
                      </div>
                    ))}
                    {dayCards.length > 3 && (
                      <span className="text-[10px] text-[#8b949e]">+{dayCards.length - 3} more</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      {tooltip && (
        <div
          className="fixed z-[100] bg-[#242b35] border border-[#30363d] rounded px-2 py-1 text-xs text-white shadow-lg pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y - 4, transform: "translate(-50%, -100%)" }}
        >
          {tooltip.title}
        </div>
      )}
    </div>
  );
}
