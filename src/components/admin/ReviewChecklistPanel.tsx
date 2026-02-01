import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface ReviewChecklistPanelProps {
  toolName: string;
}

export function ReviewChecklistPanel({ toolName }: ReviewChecklistPanelProps) {
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: "functional", label: "Functional checks passed", checked: false },
    { id: "trust", label: "Trust & safety verified", checked: false },
    { id: "audience", label: "Audience fit (Over-40s)", checked: false },
    { id: "stability", label: "Stability signals confirmed", checked: false },
  ]);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const completedCount = items.filter(i => i.checked).length;

  return (
    <div className="bg-muted/30 border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">Review Checklist</h4>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{items.length}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={cn(
              "w-full flex items-center gap-2 p-2 rounded-md text-left text-sm transition-colors touch-manipulation",
              item.checked 
                ? "bg-primary/10 text-foreground" 
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            {item.checked ? (
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
            )}
            <span className={item.checked ? "line-through opacity-70" : ""}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      <Link
        to="/admin/governance/trust-ladder"
        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <ExternalLink className="h-3 w-3" />
        Open Governance Playbook
      </Link>
    </div>
  );
}
