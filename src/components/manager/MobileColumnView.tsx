import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Card, Column, ChecklistItem, Label } from "@/lib/manager/types";
import ManageCard from "./ManageCard";

interface MobileColumnViewProps {
  cards: Card[];
  columns: Column[];
  checklists: Record<string, ChecklistItem[]>;
  cardLabelsMap: Record<string, Label[]>;
  filterLabelId: string | null;
  onCardClick: (card: Card) => void;
  onMoveCard: (cardId: string, newColumnId: string) => void;
}

export default function MobileColumnView({
  cards, columns, checklists, cardLabelsMap, filterLabelId, onCardClick, onMoveCard,
}: MobileColumnViewProps) {
  const [selectedCol, setSelectedCol] = useState(columns[0]?.id || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedColumn = columns.find((c) => c.id === selectedCol);
  const colCards = cards
    .filter((c) => c.column_id === selectedCol)
    .filter((c) => !filterLabelId || cardLabelsMap[c.id]?.some((l) => l.id === filterLabelId))
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Column selector dropdown */}
      <div className="px-4 py-3 border-b border-[var(--border)] relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
        >
          <span className="font-medium">{selectedColumn?.name || "Select column"}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-full">{colCards.length}</span>
            <ChevronDown className={cn("h-4 w-4 text-[var(--text-muted)] transition-transform", dropdownOpen && "rotate-180")} />
          </div>
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <div className="absolute left-4 right-4 top-full mt-1 z-20 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden">
              {columns.map((col) => {
                const count = cards
                  .filter((c) => c.column_id === col.id)
                  .filter((c) => !filterLabelId || cardLabelsMap[c.id]?.some((l) => l.id === filterLabelId))
                  .length;
                return (
                  <button
                    key={col.id}
                    onClick={() => { setSelectedCol(col.id); setDropdownOpen(false); }}
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-3 text-sm transition-colors",
                      col.id === selectedCol
                        ? "bg-[#00bcd4]/10 text-[#00bcd4]"
                        : "text-[var(--text-primary)] hover:bg-[var(--bg-sidebar)]"
                    )}
                  >
                    <span>{col.name}</span>
                    <span className="text-xs text-[var(--text-muted)]">{count}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {colCards.map((card) => (
          <ManageCard
            key={card.id}
            card={card}
            checklist={checklists[card.id]}
            labels={cardLabelsMap[card.id]}
            onClick={() => onCardClick(card)}
            onDragStart={() => {}}
          />
        ))}
        {colCards.length === 0 && (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">No cards in this column</div>
        )}
      </div>
    </div>
  );
}
