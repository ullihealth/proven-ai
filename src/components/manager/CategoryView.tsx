import { useState } from "react";
import { updateCard } from "@/lib/manager/managerApi";
import type { Card } from "@/lib/manager/types";
import { CATEGORY_COLORS } from "@/lib/manager/types";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { format, addDays } from "date-fns";

const boardNames: Record<string, string> = {
  content: "Content Pipeline",
  platform: "ProvenAI Platform",
  funnel: "Funnel & Email",
  bizdev: "Business Dev",
  strategy: "Strategy & Horizon",
};

const assigneeConfig: Record<string, { initials: string; color: string }> = {
  jeff: { initials: "JT", color: "bg-[#00bcd4]" },
  wife: { initials: "A", color: "bg-[#e91e8c]" },
};

const priorityOrder: Record<string, number> = { critical: 0, this_week: 1, backlog: 2 };

export default function CategoryView({
  cards,
  setCards,
  catSettings,
  onCardClick,
  onDelete,
  fadingOut,
  load,
}: {
  cards: Card[];
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  catSettings: Record<string, string>;
  onCardClick: (card: Card) => void;
  onDelete: (cardId: string) => void;
  fadingOut: Set<string>;
  load: () => void;
}) {
  const [dragOverLane, setDragOverLane] = useState<string | null>(null);
  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [dragSourceLane, setDragSourceLane] = useState<string | null>(null);

  const categorizeByCat = (cards: Card[]) => {
    const lanes: Record<string, Card[]> = { A: [], B: [], C: [], D: [], uncategorised: [] };
    for (const c of cards) {
      const cat = c.category;
      if (cat && lanes[cat]) lanes[cat].push(c);
      else lanes.uncategorised.push(c);
    }
    for (const key of Object.keys(lanes)) {
      lanes[key].sort((a, b) => {
        const ao = a.category_order == null ? Number.MAX_SAFE_INTEGER : a.category_order;
        const bo = b.category_order == null ? Number.MAX_SAFE_INTEGER : b.category_order;
        if (ao !== bo) return ao - bo;
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
      });
    }
    return lanes;
  };

  const catLanes = categorizeByCat(cards);

  const handleCategoryDrop = async (targetCat: string) => {
    if (!dragCardId) return;
    const card = cards.find((c) => c.id === dragCardId);
    if (!card) return;

    const newCategory = targetCat === "uncategorised" ? null : (targetCat as Card["category"]);
    const updates: Partial<Card> = { category: newCategory };

    if (newCategory && !card.start_date && !card.due_date) {
      const daysKey = `cat_${newCategory.toLowerCase()}_days`;
      const days = parseInt(catSettings[daysKey] || "30", 10);
      const today = new Date();
      updates.start_date = format(today, "yyyy-MM-dd");
      updates.due_date = format(addDays(today, days), "yyyy-MM-dd");
    }

    setCards((prev) => prev.map((c) => (c.id === dragCardId ? { ...c, ...updates } : c)));
    setDragCardId(null);
    setDragSourceLane(null);
    setDragOverLane(null);

    try {
      await updateCard(dragCardId, updates);
    } catch {
      load();
    }
  };

  const handleReorder = async (laneKey: string, dragId: string, beforeId: string | null) => {
    const lane = catLanes[laneKey];
    if (!lane || !dragId) return;
    const newList = lane.filter((c) => c.id !== dragId);
    const idx = beforeId != null ? newList.findIndex((c) => c.id === beforeId) : newList.length;
    const dragged = lane.find((c) => c.id === dragId);
    if (!dragged) return;
    newList.splice(idx >= 0 ? idx : newList.length, 0, dragged);
    setCards((prev) => {
      const orderMap = new Map(newList.map((c, i) => [c.id, i]));
      return prev.map((c) => (orderMap.has(c.id) ? { ...c, category_order: orderMap.get(c.id)! } : c));
    });
    setDragCardId(null);
    setDragSourceLane(null);
    for (let i = 0; i < newList.length; i++) {
      try {
        await updateCard(newList[i].id, { category_order: i });
      } catch {}
    }
  };

  const catDays = {
    A: catSettings.cat_a_days || "7",
    B: catSettings.cat_b_days || "30",
    C: catSettings.cat_c_days || "90",
    D: catSettings.cat_d_days || "180",
  };

  const categoryLanes = [
    { key: "A", label: `🟢 Category A — complete within ${catDays.A} days`, color: CATEGORY_COLORS.A },
    { key: "B", label: `🟠 Category B — complete within ${catDays.B} days`, color: CATEGORY_COLORS.B },
    { key: "C", label: `🔵 Category C — complete within ${catDays.C} days`, color: CATEGORY_COLORS.C },
    { key: "D", label: `🟣 Category D — complete within ${catDays.D} days`, color: CATEGORY_COLORS.D },
    { key: "uncategorised", label: "⚪ Uncategorised", color: "#a0aab8" },
  ];

  return (
    <>
      {categoryLanes.map(({ key, label, color }) => (
        <CategoryLane
          key={key}
          laneKey={key}
          title={label}
          color={color}
          cards={catLanes[key] || []}
          onCardClick={onCardClick}
          onDelete={onDelete}
          fadingOut={fadingOut}
          isDragOver={dragOverLane === key}
          onDragOver={(e) => { e.preventDefault(); setDragOverLane(key); }}
          onDragLeave={() => setDragOverLane(null)}
          onDrop={() => handleCategoryDrop(key)}
          onDragStartCard={(id) => { setDragCardId(id); setDragSourceLane(key); }}
          dragCardId={dragCardId}
          dragSourceLane={dragSourceLane}
          onReorderDrop={(beforeId) => { if (dragCardId) handleReorder(key, dragCardId, beforeId); }}
        />
      ))}
    </>
  );
}

function CategoryLane({
  laneKey, title, color, cards, onCardClick, onDelete, fadingOut,
  isDragOver, onDragOver, onDragLeave, onDrop, onDragStartCard,
  dragCardId, dragSourceLane, onReorderDrop,
}: {
  laneKey: string; title: string; color: string; cards: Card[];
  onCardClick: (c: Card) => void; onDelete: (id: string) => void; fadingOut: Set<string>;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void; onDragLeave: () => void; onDrop: () => void;
  onDragStartCard: (id: string) => void;
  dragCardId: string | null; dragSourceLane: string | null;
  onReorderDrop: (beforeCardId: string | null) => void;
}) {
  const [innerDragOverId, setInnerDragOverId] = useState<string | null>(null);
  const isReorder = dragSourceLane === laneKey;

  return (
    <section
      onDragOver={(e) => { e.preventDefault(); if (!isReorder) onDragOver(e); }}
      onDragLeave={(e) => {
        const related = e.relatedTarget as Node | null;
        if (!e.currentTarget.contains(related)) {
          if (!isReorder) onDragLeave();
          else setInnerDragOverId(null);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (isReorder) { onReorderDrop(innerDragOverId); }
        else { onDrop(); }
        setInnerDragOverId(null);
      }}
      className={cn("rounded-lg transition-colors", !isReorder && isDragOver && "ring-2 ring-offset-2 ring-offset-[#13181f]")}
      style={!isReorder && isDragOver ? { outlineColor: color, ["--tw-ring-color" as string]: color } : undefined}
    >
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
        {title} <span className="text-[var(--text-muted)] font-normal text-sm">({cards.length})</span>
      </h2>
      {cards.length === 0 ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center text-sm text-[var(--text-muted)] transition-colors",
            !isReorder && isDragOver ? "border-opacity-60" : "border-[var(--border)]"
          )}
          style={!isReorder && isDragOver ? { borderColor: color } : undefined}
        >
          Drop cards here
        </div>
      ) : (
        <div className="space-y-1.5">
          {cards.map((card) => (
            <div key={card.id}>
              {isReorder && innerDragOverId === card.id && (
                <div className="h-0.5 rounded-full mb-1 opacity-80" style={{ backgroundColor: color }} />
              )}
              <div
                draggable
                onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStartCard(card.id); }}
                onDragEnter={() => { if (isReorder && card.id !== dragCardId) setInnerDragOverId(card.id); }}
              >
                <CategoryCardRow
                  card={card}
                  onClick={() => onCardClick(card)}
                  onDelete={() => onDelete(card.id)}
                  isFading={fadingOut.has(card.id)}
                />
              </div>
            </div>
          ))}
          {isReorder && innerDragOverId === null && dragCardId !== null && (
            <div className="h-0.5 rounded-full mt-1 opacity-80" style={{ backgroundColor: color }} />
          )}
        </div>
      )}
    </section>
  );
}

function CategoryCardRow({ card, onClick, onDelete, isFading }: {
  card: Card; onClick: () => void; onDelete: () => void; isFading: boolean;
}) {
  const a = assigneeConfig[card.assignee] ?? { initials: "?", color: "bg-[#a0aab8]" };
  const catColor = card.category ? CATEGORY_COLORS[card.category] : undefined;

  return (
    <div className={cn(
      "group flex items-center gap-3 w-full p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[#00bcd4]/40 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.4)] cursor-grab",
      isFading && "opacity-0 scale-95 transition-all duration-300"
    )}>
      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: catColor || "#a0aab8" }} />
      <button onClick={onClick} className="flex-1 text-sm text-[var(--text-primary)] truncate text-left hover:text-[#00bcd4] transition-colors">
        {card.title}
      </button>
      <span className="text-xs text-[var(--text-muted)] flex-shrink-0 w-28 text-right truncate">{boardNames[card.board_id] || card.board_id}</span>
      <span className="text-xs text-[var(--text-muted)] flex-shrink-0 w-20 text-right">
        {card.due_date || "No date"}
      </span>
      <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-[#0d1117] flex-shrink-0", a.color)}>
        {a.initials}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex-shrink-0 h-5 w-5 rounded flex items-center justify-center text-[var(--text-muted)]/0 group-hover:text-[#f85149]/70 hover:!text-[#f85149] hover:bg-[#f85149]/10 transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
