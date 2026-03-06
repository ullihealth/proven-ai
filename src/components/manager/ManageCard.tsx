import { format, isPast, isToday } from "date-fns";
import { GripVertical, Calendar, CheckSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Card, ChecklistItem, Label } from "@/lib/manager/types";
import { getRagStatus, ragDotColor } from "@/lib/manager/ragStatus";

const priorityConfig = {
  critical: { label: "CRITICAL", bg: "bg-[#f85149]/20", text: "text-[#f85149]", border: "border-[#f85149]/40" },
  this_week: { label: "THIS WEEK", bg: "bg-[#00bcd4]/20", text: "text-[#00bcd4]", border: "border-[#00bcd4]/40" },
  backlog: { label: "BACKLOG", bg: "bg-[#a0aab8]/20", text: "text-[#a0aab8]", border: "border-[#a0aab8]/40" },
} as const;

const assigneeConfig = {
  jeff: { initials: "JT", color: "bg-[#00bcd4]" },
  wife: { initials: "W", color: "bg-[#e91e8c]" },
} as const;

interface ManageCardProps {
  card: Card;
  checklist?: ChecklistItem[];
  labels?: Label[];
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export default function ManageCard({ card, checklist = [], labels = [], onClick, onDragStart }: ManageCardProps) {
  const priority = priorityConfig[card.priority];
  const assignee = assigneeConfig[card.assignee];
  const doneCount = checklist.filter((c) => c.done).length;
  const totalCount = checklist.length;

  const rag = getRagStatus(card);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="p-3 rounded-lg bg-[#242b35] border border-[#30363d] cursor-pointer hover:border-[#00bcd4]/50 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.4)] group"
    >
      {/* Title + grip */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-[#e0e7ef] leading-snug font-medium">{card.title}</span>
        <GripVertical className="h-3.5 w-3.5 text-[#30363d] group-hover:text-[#a0aab8] flex-shrink-0 mt-0.5 cursor-grab" />
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
          <span className="text-[10px] text-[#a0aab8] bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d]">{card.content_type}</span>
        )}
        {card.card_type && !card.content_type && (
          <span className="text-[10px] text-[#a0aab8] bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d]">{card.card_type}</span>
        )}
      </div>

      {/* Bottom row */}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {card.due_date && (
            <span className="flex items-center gap-1 text-[11px] text-[#a0aab8]">
              <span className={cn("h-2 w-2 rounded-full flex-shrink-0", ragDotColor[rag])} />
              <Calendar className="h-3 w-3" />
              {format(new Date(card.due_date), "MMM d")}
            </span>
          )}
          {totalCount > 0 && (
            <span className={cn("flex items-center gap-1 text-[11px]",
              doneCount === totalCount ? "text-[#3fb950]" : "text-[#a0aab8]"
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
        <div className="mt-2 h-1 rounded-full bg-[#30363d] overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", doneCount === totalCount ? "bg-[#3fb950]" : "bg-[#00bcd4]")}
            style={{ width: `${(doneCount / totalCount) * 100}%` }} />
        </div>
      )}
    </div>
  );
}
