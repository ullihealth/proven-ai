import { useState, useRef, useCallback } from "react";
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

const priorityOrder: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

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
  const [insertBefore, setInsertBefore] = useState<{ laneKey: string; cardId: string | null } | null>(null);

  // Flying-clone drag state
  const dragRef = useRef<{
    pointerId: number;
    cardId: string;
    sourceLane: string;
    startX: number;
    startY: number;
    isDragging: boolean;
    clone: HTMLElement | null;
    placeholder: HTMLElement | null;
    sourceEl: HTMLElement | null;
  } | null>(null);

  const laneRefs = useRef<Map<string, HTMLElement>>(new Map());
  const cardRowRefs = useRef<Map<string, HTMLElement>>(new Map());

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

  const getLaneAtPoint = useCallback((clientX: number, clientY: number): string | null => {
    const clone = dragRef.current?.clone;
    if (clone) clone.style.pointerEvents = "none";
    let el = document.elementFromPoint(clientX, clientY);
    if (clone) clone.style.pointerEvents = "";
    while (el && el !== document.body) {
      for (const [key, laneEl] of laneRefs.current) {
        if (laneEl === el || laneEl.contains(el)) return key;
      }
      el = el.parentElement;
    }
    return null;
  }, []);

  const getInsertBeforeId = useCallback((laneKey: string, clientY: number, excludeId: string): string | null => {
    const laneCards = catLanes[laneKey] ?? [];
    for (const card of laneCards) {
      if (card.id === excludeId) continue;
      const el = cardRowRefs.current.get(card.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return card.id;
    }
    return null;
  }, [catLanes]);

  const cleanupDrag = useCallback(() => {
    const s = dragRef.current;
    if (!s) return;
    if (s.clone) s.clone.remove();
    if (s.placeholder) s.placeholder.remove();
    if (s.sourceEl) s.sourceEl.style.visibility = "";
    dragRef.current = null;
    setDragOverLane(null);
    setInsertBefore(null);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, cardId: string, laneKey: string) => {
    if ((e.target as Element).closest("button,input,textarea,a,select")) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId, cardId, sourceLane: laneKey,
      startX: e.clientX, startY: e.clientY,
      isDragging: false,
      clone: null, placeholder: null,
      sourceEl: e.currentTarget as HTMLElement,
    };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const s = dragRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;

    if (!s.isDragging) {
      if (Math.hypot(dx, dy) < 8) return;
      s.isDragging = true;

      const srcRect = s.sourceEl!.getBoundingClientRect();
      const clone = s.sourceEl!.cloneNode(true) as HTMLElement;
      clone.style.cssText = [
        `position:fixed`,
        `left:${srcRect.left}px`,
        `top:${srcRect.top}px`,
        `width:${srcRect.width}px`,
        `height:${srcRect.height}px`,
        `margin:0`,
        `pointer-events:none`,
        `z-index:9999`,
        `opacity:0.92`,
        `box-shadow:0 8px 32px rgba(0,0,0,0.6)`,
        `transform:translate(0,0)`,
        `transition:none`,
        `cursor:grabbing`,
      ].join(";");
      document.body.appendChild(clone);
      s.clone = clone;

      const ph = document.createElement("div");
      ph.style.cssText = `height:${srcRect.height}px;border-radius:8px;background:rgba(0,188,212,0.08);border:1.5px dashed #00bcd4;pointer-events:none;`;
      s.sourceEl!.insertAdjacentElement("afterend", ph);
      s.placeholder = ph;
      s.sourceEl!.style.visibility = "hidden";
    }

    if (s.clone) {
      s.clone.style.transform = `translate(${e.clientX - s.startX}px, ${e.clientY - s.startY}px)`;
    }

    const targetLane = getLaneAtPoint(e.clientX, e.clientY);
    setDragOverLane(targetLane);
    if (targetLane) {
      const beforeId = getInsertBeforeId(targetLane, e.clientY, s.cardId);
      setInsertBefore({ laneKey: targetLane, cardId: beforeId });
    } else {
      setInsertBefore(null);
    }
  }, [getLaneAtPoint, getInsertBeforeId]);

  const handlePointerUp = useCallback(async (e: React.PointerEvent) => {
    const s = dragRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    const wasDragging = s.isDragging;
    const { cardId, sourceLane } = s;
    const targetLane = getLaneAtPoint(e.clientX, e.clientY);
    const beforeId = targetLane ? getInsertBeforeId(targetLane, e.clientY, cardId) : null;
    cleanupDrag();

    if (!wasDragging) {
      const card = cards.find((c) => c.id === cardId);
      if (card) onCardClick(card);
      return;
    }

    if (!targetLane) return;

    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    if (targetLane !== sourceLane) {
      // Move to different category lane
      const newCategory = targetLane === "uncategorised" ? null : (targetLane as Card["category"]);
      const updates: Partial<Card> = { category: newCategory };
      if (newCategory && !card.start_date && !card.due_date) {
        const daysKey = `cat_${newCategory.toLowerCase()}_days`;
        const days = parseInt(catSettings[daysKey] || "30", 10);
        const today = new Date();
        updates.start_date = format(today, "yyyy-MM-dd");
        updates.due_date = format(addDays(today, days), "yyyy-MM-dd");
      }
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...updates } : c)));
      try {
        await updateCard(cardId, updates);
      } catch {
        load();
      }
    } else {
      // Reorder within same lane
      const lane = catLanes[sourceLane];
      if (!lane) return;
      const newList = lane.filter((c) => c.id !== cardId);
      const idx = beforeId != null ? newList.findIndex((c) => c.id === beforeId) : newList.length;
      const dragged = lane.find((c) => c.id === cardId);
      if (!dragged) return;
      newList.splice(idx >= 0 ? idx : newList.length, 0, dragged);
      setCards((prev) => {
        const orderMap = new Map(newList.map((c, i) => [c.id, i]));
        return prev.map((c) => (orderMap.has(c.id) ? { ...c, category_order: orderMap.get(c.id)! } : c));
      });
      for (let i = 0; i < newList.length; i++) {
        try { await updateCard(newList[i].id, { category_order: i }); } catch {}
      }
    }
  }, [cards, catLanes, catSettings, getLaneAtPoint, getInsertBeforeId, cleanupDrag, onCardClick, setCards, load]);

  const handlePointerCancel = useCallback(() => { cleanupDrag(); }, [cleanupDrag]);

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
        <section
          key={key}
          ref={(el) => { if (el) laneRefs.current.set(key, el); else laneRefs.current.delete(key); }}
          className={cn("rounded-lg transition-colors", dragOverLane === key && "ring-2 ring-offset-2 ring-offset-[#13181f]")}
          style={dragOverLane === key ? { ["--tw-ring-color" as string]: color } : undefined}
        >
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
            {label} <span className="text-[var(--text-muted)] font-normal text-sm">({(catLanes[key] || []).length})</span>
          </h2>
          {(catLanes[key] || []).length === 0 ? (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center text-sm text-[var(--text-muted)] transition-colors",
                dragOverLane === key ? "border-opacity-60" : "border-[var(--border)]"
              )}
              style={dragOverLane === key ? { borderColor: color } : undefined}
            >
              Drop cards here
            </div>
          ) : (
            <div className="space-y-1.5">
              {(catLanes[key] || []).map((card) => (
                <div key={card.id}>
                  {insertBefore?.laneKey === key && insertBefore.cardId === card.id && (
                    <div className="h-0.5 rounded-full mb-1 opacity-80" style={{ backgroundColor: color }} />
                  )}
                  <div
                    ref={(el) => { if (el) cardRowRefs.current.set(card.id, el); else cardRowRefs.current.delete(card.id); }}
                    onPointerDown={(e) => handlePointerDown(e, card.id, key)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
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
              {insertBefore?.laneKey === key && insertBefore.cardId === null && (
                <div className="h-0.5 rounded-full mt-1 opacity-80" style={{ backgroundColor: color }} />
              )}
            </div>
          )}
        </section>
      ))}
    </>
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
