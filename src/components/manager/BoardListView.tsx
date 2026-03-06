import { format } from "date-fns";
import type { Card, Column, ChecklistItem } from "@/lib/manager/types";
import { cn } from "@/lib/utils";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

const priorityLabel: Record<string, { text: string; class: string }> = {
  critical: { text: "Critical", class: "text-[#f85149] bg-[#f85149]/10 border-[#f85149]/30" },
  this_week: { text: "This Week", class: "text-[#00bcd4] bg-[#00bcd4]/10 border-[#00bcd4]/30" },
  backlog: { text: "Backlog", class: "text-[#8b949e] bg-[#8b949e]/10 border-[#8b949e]/30" },
};

const assigneeColors: Record<string, string> = {
  jeff: "bg-[#00bcd4]",
  wife: "bg-[#e91e8c]",
};

type SortKey = "title" | "priority" | "assignee" | "due_date" | "column";
type SortDir = "asc" | "desc";

const priorityOrder: Record<string, number> = { critical: 0, this_week: 1, backlog: 2 };

interface Props {
  cards: Card[];
  columns: Column[];
  checklists: Record<string, ChecklistItem[]>;
  onCardClick: (card: Card) => void;
}

export default function BoardListView({ cards, columns, checklists, onCardClick }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const colMap = Object.fromEntries(columns.map((c) => [c.id, c]));

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = [...cards].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "title": cmp = a.title.localeCompare(b.title); break;
      case "priority": cmp = (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9); break;
      case "assignee": cmp = a.assignee.localeCompare(b.assignee); break;
      case "due_date": cmp = (a.due_date || "z").localeCompare(b.due_date || "z"); break;
      case "column": cmp = (colMap[a.column_id]?.sort_order ?? 0) - (colMap[b.column_id]?.sort_order ?? 0); break;
    }
    return sortDir === "desc" ? -cmp : cmp;
  });

  const today = new Date().toISOString().slice(0, 10);

  const headerBtn = (key: SortKey, label: string) => (
    <button onClick={() => toggleSort(key)} className="flex items-center gap-1 text-xs font-mono text-[#8b949e] uppercase tracking-wider hover:text-[#c9d1d9] transition-colors">
      {label}
      <ArrowUpDown className={cn("h-3 w-3", sortKey === key ? "text-[#00bcd4]" : "text-[#8b949e]/50")} />
    </button>
  );

  return (
    <div className="p-4">
      <div className="rounded-lg border border-[#30363d] overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_100px_80px_110px_120px_60px] gap-2 px-4 py-3 bg-[#161b22] border-b border-[#30363d]">
          {headerBtn("title", "Title")}
          {headerBtn("priority", "Priority")}
          {headerBtn("assignee", "Assignee")}
          {headerBtn("due_date", "Due Date")}
          {headerBtn("column", "Status")}
          <span className="text-xs font-mono text-[#8b949e] uppercase tracking-wider">Tasks</span>
        </div>

        {/* Rows */}
        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[#8b949e]">No cards yet</div>
        ) : (
          sorted.map((card) => {
            const cl = checklists[card.id];
            const done = cl?.filter((c) => c.done).length ?? 0;
            const total = cl?.length ?? 0;
            const p = priorityLabel[card.priority];
            const isOverdue = card.due_date && card.due_date < today;

            return (
              <button
                key={card.id}
                onClick={() => onCardClick(card)}
                className="grid grid-cols-[1fr_100px_80px_110px_120px_60px] gap-2 px-4 py-3 w-full text-left hover:bg-[#1c2128] transition-colors border-b border-[#30363d] last:border-b-0"
              >
                <span className="text-sm text-[#c9d1d9] truncate">{card.title}</span>
                <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border self-center w-fit", p.class)}>
                  {p.text}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-[#0d1117]", assigneeColors[card.assignee])}>
                    {card.assignee[0].toUpperCase()}
                  </div>
                </div>
                <span className={cn("text-xs self-center", isOverdue ? "text-[#f85149]" : "text-[#8b949e]")}>
                  {card.due_date ? format(new Date(card.due_date + "T00:00:00"), "MMM d, yyyy") : "—"}
                </span>
                <span className="text-xs text-[#8b949e] self-center truncate">
                  {colMap[card.column_id]?.name ?? "—"}
                </span>
                <span className="text-xs text-[#8b949e] self-center">
                  {total > 0 ? `${done}/${total}` : "—"}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
