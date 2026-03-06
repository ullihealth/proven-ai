import { format, isPast, isToday } from "date-fns";
import { GripVertical, Calendar, CheckSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Card, ChecklistItem } from "@/lib/manager/types";

const priorityConfig = {
  critical: { label: "CRITICAL", bg: "bg-[#f85149]/20", text: "text-[#f85149]", border: "border-[#f85149]/40" },
  this_week: { label: "THIS WEEK", bg: "bg-[#00bcd4]/20", text: "text-[#00bcd4]", border: "border-[#00bcd4]/40" },
  backlog: { label: "BACKLOG", bg: "bg-[#8b949e]/20", text: "text-[#8b949e]", border: "border-[#8b949e]/40" },
} as const;

const assigneeConfig = {
  jeff: { initials: "JT", color: "bg-[#00bcd4]" },
  wife: { initials: "W", color: "bg-[#e91e8c]" },
} as const;

interface ManageCardProps {
  card: Card;
  checklist?: ChecklistItem[];
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export default function ManageCard({ card, checklist = [], onClick, onDragStart }: ManageCardProps) {
  const priority = priorityConfig[card.priority];
  const assignee = assigneeConfig[card.assignee];
  const doneCount = checklist.filter((c) => c.done).length;
  const totalCount = checklist.length;

  const isOverdue = card.due_date && isPast(new Date(card.due_date)) && !isToday(new Date(card.due_date));
  const isDueToday = card.due_date && isToday(new Date(card.due_date));

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="p-3 rounded-lg bg-[#1c2128] border border-[#30363d] cursor-pointer hover:border-[#00bcd4]/50 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.4)] group"
    >
      {/* Title + grip */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-[#c9d1d9] leading-snug font-medium">{card.title}</span>
        <GripVertical className="h-3.5 w-3.5 text-[#30363d] group-hover:text-[#8b949e] flex-shrink-0 mt-0.5 cursor-grab" />
      </div>

      {/* Meta row */}
      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        {/* Priority badge */}
        <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border", priority.bg, priority.text, priority.border)}>
          {priority.label}
        </span>

        {/* Content type / card type tags */}
        {card.content_type && (
          <span className="text-[10px] text-[#8b949e] bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d]">
            {card.content_type}
          </span>
        )}
        {card.card_type && !card.content_type && (
          <span className="text-[10px] text-[#8b949e] bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d]">
            {card.card_type}
          </span>
        )}
      </div>

      {/* Bottom row: due date, checklist, assignee */}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Due date */}
          {card.due_date && (
            <span className={cn(
              "flex items-center gap-1 text-[11px]",
              isOverdue ? "text-[#f85149]" : isDueToday ? "text-[#d29922]" : "text-[#8b949e]"
            )}>
              <Calendar className="h-3 w-3" />
              {format(new Date(card.due_date), "MMM d")}
            </span>
          )}

          {/* Checklist progress */}
          {totalCount > 0 && (
            <span className={cn(
              "flex items-center gap-1 text-[11px]",
              doneCount === totalCount ? "text-[#3fb950]" : "text-[#8b949e]"
            )}>
              <CheckSquare className="h-3 w-3" />
              {doneCount}/{totalCount}
            </span>
          )}
        </div>

        {/* Assignee avatar */}
        <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-[#0d1117]", assignee.color)}>
          {assignee.initials}
        </div>
      </div>

      {/* Checklist progress bar */}
      {totalCount > 0 && (
        <div className="mt-2 h-1 rounded-full bg-[#30363d] overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", doneCount === totalCount ? "bg-[#3fb950]" : "bg-[#00bcd4]")}
            style={{ width: `${(doneCount / totalCount) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
