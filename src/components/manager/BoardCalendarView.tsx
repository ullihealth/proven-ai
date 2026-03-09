import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Card, Column } from "@/lib/manager/types";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  critical: "#f85149",
  this_week: "#00bcd4",
  backlog: "#8b949e",
};

interface Props {
  cards: Card[];
  columns: Column[];
  onCardClick: (card: Card) => void;
  onCardUpdate?: (id: string, updates: Partial<Card>) => Promise<void>;
}

export default function BoardCalendarView({ cards, columns, onCardClick, onCardUpdate }: Props) {
  const [month, setMonth] = useState(new Date());
  const [tooltip, setTooltip] = useState<{ title: string; x: number; y: number } | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localCards, setLocalCards] = useState<Card[]>(cards);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  useEffect(() => { setLocalCards(cards); }, [cards]);

  const year = month.getFullYear();
  const mo = month.getMonth();
  const firstDay = new Date(year, mo, 1).getDay();
  const daysInMonth = new Date(year, mo + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const datedCards = localCards.filter((c) => c.due_date);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const colMap = Object.fromEntries(columns.map((c) => [c.id, c.name]));
  void colMap; // used only for title attribute in prior version; kept for future use

  const handleDrop = async (targetDate: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDate(null);
    const cardId = e.dataTransfer.getData("cardId");
    const origDue = e.dataTransfer.getData("origDue");
    const origStart = e.dataTransfer.getData("origStart");
    if (!cardId || !origDue || origDue === targetDate) return;
    const daysDelta = Math.round(
      (new Date(targetDate).getTime() - new Date(origDue).getTime()) / 86400000
    );
    const updates: Partial<Card> = { due_date: targetDate };
    if (origStart) {
      const ns = new Date(origStart);
      ns.setDate(ns.getDate() + daysDelta);
      updates.start_date = ns.toISOString().split("T")[0];
    }
    const prevCards = localCards;
    setLocalCards(prev => prev.map(c => c.id === cardId ? { ...c, ...updates } : c));
    if (onCardUpdate) {
      try {
        await onCardUpdate(cardId, updates);
      } catch {
        setLocalCards(prevCards);
      }
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(new Date(year, mo - 1, 1))} className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-mono text-[#c9d1d9]">
          {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <button onClick={() => setMonth(new Date(year, mo + 1, 1))} className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-mono text-[#8b949e] py-2">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-[#30363d] rounded-lg overflow-hidden">
        {cells.map((day, i) => {
          const dateStr = day ? `${year}-${String(mo + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
          const dayCards = datedCards.filter((c) => c.due_date === dateStr);
          const isToday = dateStr === today;
          const isDragOver = dragOverDate === dateStr;

          return (
            <div
              key={i}
              className={cn(
                "min-h-[100px] p-2 transition-colors",
                day ? "bg-[#0d1117]" : "bg-[#161b22]",
                isDragOver && "bg-[#00bcd4]/10 ring-1 ring-inset ring-[#00bcd4]/40"
              )}
              onDragOver={(e) => { if (day) { e.preventDefault(); setDragOverDate(dateStr); } }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverDate(null); }}
              onDrop={(e) => { if (day) handleDrop(dateStr, e); }}
            >
              {day && (
                <>
                  <span className={cn("text-xs font-mono", isToday ? "text-[#00bcd4] font-bold" : "text-[#8b949e]")}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayCards.slice(0, 3).map((card) => (
                      <button
                        key={card.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("cardId", card.id);
                          e.dataTransfer.setData("origDue", card.due_date ?? "");
                          e.dataTransfer.setData("origStart", card.start_date ?? "");
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => setDragOverDate(null)}
                        onDoubleClick={() => onCardClick(card)}
                        className="w-full text-left text-[10px] text-[#c9d1d9] truncate px-1.5 py-0.5 rounded hover:brightness-125 transition-all cursor-grab active:cursor-grabbing select-none"
                        style={{
                          backgroundColor: `${priorityColors[card.priority]}15`,
                          borderLeft: `2px solid ${priorityColors[card.priority]}`,
                        }}
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
                      </button>
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

export default function BoardCalendarView({ cards, columns, onCardClick }: Props) {
  const [month, setMonth] = useState(new Date());
  const [tooltip, setTooltip] = useState<{ title: string; x: number; y: number } | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const year = month.getFullYear();
  const mo = month.getMonth();
  const firstDay = new Date(year, mo, 1).getDay();
  const daysInMonth = new Date(year, mo + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const datedCards = cards.filter((c) => c.due_date);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const colMap = Object.fromEntries(columns.map((c) => [c.id, c.name]));

  return (
    <div className="p-4 space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(new Date(year, mo - 1, 1))} className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-mono text-[#c9d1d9]">
          {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <button onClick={() => setMonth(new Date(year, mo + 1, 1))} className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-mono text-[#8b949e] py-2">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-[#30363d] rounded-lg overflow-hidden">
        {cells.map((day, i) => {
          const dateStr = day ? `${year}-${String(mo + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
          const dayCards = datedCards.filter((c) => c.due_date === dateStr);
          const isToday = dateStr === today;

          return (
            <div
              key={i}
              className={cn("min-h-[100px] p-2", day ? "bg-[#0d1117]" : "bg-[#161b22]")}
            >
              {day && (
                <>
                  <span className={cn("text-xs font-mono", isToday ? "text-[#00bcd4] font-bold" : "text-[#8b949e]")}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayCards.slice(0, 3).map((card) => (
                      <button
                        key={card.id}
                        onClick={() => onCardClick(card)}
                        className="w-full text-left text-[10px] text-[#c9d1d9] truncate px-1.5 py-0.5 rounded hover:brightness-125 transition-all"
                        style={{
                          backgroundColor: `${priorityColors[card.priority]}15`,
                          borderLeft: `2px solid ${priorityColors[card.priority]}`,
                        }}
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
                      </button>
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
      </div>      {tooltip && (
        <div
          className="fixed z-[100] bg-[#242b35] border border-[#30363d] rounded px-2 py-1 text-xs text-white shadow-lg pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y - 4, transform: "translate(-50%, -100%)" }}
        >
          {tooltip.title}
        </div>
      )}    </div>
  );
}
