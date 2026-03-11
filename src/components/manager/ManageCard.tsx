import { format, isPast, isToday } from "date-fns";
import { GripVertical, Calendar, CheckSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Card, ChecklistItem, Label } from "@/lib/manager/types";
import { CATEGORY_COLORS } from "@/lib/manager/types";
import { getRagStatus, ragDotColor } from "@/lib/manager/ragStatus";

const priorityConfig = {
  A: { label: "A", bg: "bg-[#d29922]/20", text: "text-[#d29922]", border: "border-[#d29922]/40" },
  B: { label: "B", bg: "bg-[#00bcd4]/20", text: "text-[#00bcd4]", border: "border-[#00bcd4]/40" },
  C: { label: "C", bg: "bg-[#9c27b0]/20", text: "text-[#9c27b0]", border: "border-[#9c27b0]/40" },
  D: { label: "D", bg: "bg-[#4caf50]/20", text: "text-[#4caf50]", border: "border-[#4caf50]/40" },
} as const;

const assigneeConfig = {
  jeff: { initials: "JT", color: "bg-[#00bcd4]" },
  wife: { initials: "A", color: "bg-[#e91e8c]" },
} as const;

interface ManageCardProps {
  card: Card;
  checklist?: ChecklistItem[];
  labels?: Label[];
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export default function ManageCard({ card, checklist = [], labels = [], onClick, onDragStart }: ManageCardProps) {
  const priority = priorityConfig[card.priority as keyof typeof priorityConfig] ?? priorityConfig["D"];
  const assignee = assigneeConfig[card.assignee];
  const doneCount = checklist.filter((c) => c.done).length;
  const totalCount = checklist.length;

  const rag = getRagStatus(card);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="relative p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] cursor-pointer hover:border-[#00bcd4]/50 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.4)] group overflow-hidden"
    >
      {/* Category left border */}
      {card.category && CATEGORY_COLORS[card.category] && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg" style={{ backgroundColor: CATEGORY_COLORS[card.category] }} />
      )}
      {/* Title + grip */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-[var(--text-primary)] leading-snug font-medium">{card.title}</span>
        <GripVertical className="h-3.5 w-3.5 text-[#30363d] group-hover:text-[var(--text-muted)] flex-shrink-0 mt-0.5 cursor-grab" />
      </div>

      {/* Label pills */}
      {labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {labels.map((l) => (
            <span key={l.id} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: l.color }}>
              {l.name}
            </span>
          ))}
        </div>
      )}

      {/* Meta row */}
      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border", priority.bg, priority.text, priority.border)}>
          {priority.label}
        </span>
        {card.content_type && (
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-sidebar)] px-1.5 py-0.5 rounded border border-[var(--border)]">{card.content_type}</span>
        )}
        {card.card_type && !card.content_type && (
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-sidebar)] px-1.5 py-0.5 rounded border border-[var(--border)]">{card.card_type}</span>
        )}
      </div>

      {/* Bottom row */}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {card.due_date && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
              <span className={cn("h-2 w-2 rounded-full flex-shrink-0", ragDotColor[rag])} />
              <Calendar className="h-3 w-3" />
              {format(new Date(card.due_date), "MMM d")}
            </span>
          )}
          {totalCount > 0 && (
            <span className={cn("flex items-center gap-1 text-[11px]",
              doneCount === totalCount ? "text-[#3fb950]" : "text-[var(--text-muted)]"
            )}>
              <CheckSquare className="h-3 w-3" />
              {doneCount}/{totalCount}
            </span>
          )}
        </div>
        <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-[#0d1117]", assignee.color)}>
          {assignee.initials}
        </div>
      </div>

      {totalCount > 0 && (
        <div className="mt-2 h-1 rounded-full bg-[var(--bg-hover)] overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", doneCount === totalCount ? "bg-[#3fb950]" : "bg-[#00bcd4]")}
            style={{ width: `${(doneCount / totalCount) * 100}%` }} />
        </div>
      )}
    </div>
  );
}
