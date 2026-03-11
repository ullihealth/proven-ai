import { useEffect, useRef, useState } from "react";

import { fetchAllCards, type Card } from "@/lib/manager";
import { updateCard, fetchBoard } from "@/lib/manager/managerApi";
import type { Column } from "@/lib/manager/types";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import ManageCardModal from "@/components/manager/ManageCardModal";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [columnsMap, setColumnsMap] = useState<Record<string, Column[]>>({});

  useEffect(() => {
    fetchAllCards()
      .then((d) => setCards(d.cards.filter((c) => c.due_date)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCardDoubleClick = async (card: Card) => {
    if (!columnsMap[card.board_id]) {
      try {
        const data = await fetchBoard(card.board_id);
        setColumnsMap(prev => ({ ...prev, [card.board_id]: data.columns }));
      } catch {
        setColumnsMap(prev => ({ ...prev, [card.board_id]: [] }));
      }
    }
    setEditCard(card);
  };

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
    const prevCards = cards;
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...updates } : c));
    try {
      await updateCard(cardId, updates);
    } catch {
      setCards(prevCards);
      toast({ title: "Save failed", description: "Card dates could not be saved", variant: "destructive" });
    }
  };

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
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Calendar</h1>
        <div className="flex items-center gap-4">
          <button onClick={prev} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><ChevronLeft className="h-5 w-5" /></button>
          <span className="text-sm font-mono text-[var(--text-primary)]">
            {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button onClick={next} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-mono text-[var(--text-muted)] py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-[var(--bg-primary)] rounded-lg overflow-hidden">
        {cells.map((day, i) => {
          const dateStr = day ? `${year}-${String(mo + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
          const dayCards = cards.filter((c) => c.due_date === dateStr);
          const isToday = dateStr === new Date().toISOString().slice(0, 10);
          const isDragOver = dragOverDate === dateStr;

          return (
            <div
              key={i}
              className={cn(
                "min-h-[100px] p-2 transition-colors",
                day ? "bg-[var(--bg-elevated)] border border-[var(--border)]" : "bg-[var(--bg-primary)]",
                isDragOver && "bg-[#00bcd4]/10 ring-1 ring-inset ring-[#00bcd4]/40"
              )}
              onDragOver={(e) => { if (day) { e.preventDefault(); setDragOverDate(dateStr); } }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverDate(null); }}
              onDrop={(e) => { if (day) handleDrop(dateStr, e); }}
            >
              {day && (
                <>
                  <span className={cn("text-xs font-mono", isToday ? "text-[#00bcd4] font-bold" : "text-[var(--text-muted)]")}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayCards.slice(0, 3).map((card) => (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("cardId", card.id);
                          e.dataTransfer.setData("origDue", card.due_date ?? "");
                          e.dataTransfer.setData("origStart", card.start_date ?? "");
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => setDragOverDate(null)}
                        onDoubleClick={() => handleCardDoubleClick(card)}
                        className="text-[10px] text-[var(--text-primary)] truncate px-1 py-0.5 rounded cursor-grab active:cursor-grabbing select-none"
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
                      <span className="text-[10px] text-[var(--text-muted)]">+{dayCards.length - 3} more</span>
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
          className="fixed z-[100] bg-[var(--bg-elevated)] border border-[var(--border)] rounded px-2 py-1 text-xs text-white shadow-lg pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y - 4, transform: "translate(-50%, -100%)" }}
        >
          {tooltip.title}
        </div>
      )}
      {editCard && columnsMap[editCard.board_id] && (
        <ManageCardModal
          card={editCard}
          columns={columnsMap[editCard.board_id]}
          boardId={editCard.board_id}
          onClose={() => setEditCard(null)}
          onSaved={() => setEditCard(null)}
        />
      )}
    </div>
  );
}
