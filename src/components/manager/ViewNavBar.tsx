import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type ViewMode = "dashboard" | "category" | "timeline";

interface ViewNavBarProps {
  currentView: ViewMode;
  /** Provide this when on the Dashboard page to switch views without navigating */
  onViewChange?: (v: "dashboard" | "category") => void;
  assigneeFilter?: string;
  onAssigneeChange?: (v: string) => void;
  boardFilter?: string;
  onBoardFilterChange?: (v: string) => void;
  boardIds?: string[];
  boardNameMap?: Record<string, string>;
}

const selectClass =
  "px-3 py-1.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:border-[#00bcd4] focus:outline-none appearance-none";

export default function ViewNavBar({
  currentView,
  onViewChange,
  assigneeFilter,
  onAssigneeChange,
  boardFilter,
  onBoardFilterChange,
  boardIds = [],
  boardNameMap = {},
}: ViewNavBarProps) {
  const navigate = useNavigate();

  const handleDashboard = () => {
    if (onViewChange) {
      onViewChange("dashboard");
    } else {
      navigate("/manage");
    }
  };

  const handleCategory = () => {
    if (onViewChange) {
      onViewChange("category");
    } else {
      try { localStorage.setItem("dashboard_view", "category"); } catch {}
      navigate("/manage");
    }
  };

  const btnClass = (active: boolean) =>
    cn(
      "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
      active
        ? "bg-[#00bcd4] text-[#0d1117]"
        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
    );

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-0.5 bg-[var(--bg-sidebar)] rounded-lg border border-[var(--border)] p-0.5">
        <button onClick={handleDashboard} className={btnClass(currentView === "dashboard")}>
          Dashboard
        </button>
        <button onClick={handleCategory} className={btnClass(currentView === "category")}>
          Category View
        </button>
        <button
          onClick={() => navigate("/manage/timeline")}
          className={btnClass(currentView === "timeline")}
        >
          Timeline
        </button>
      </div>
      {onAssigneeChange && (
        <select
          value={assigneeFilter ?? "all"}
          onChange={(e) => onAssigneeChange(e.target.value)}
          className={selectClass}
        >
          <option value="all">Assignees</option>
          <option value="jeff">Jeff</option>
          <option value="wife">Aneta</option>
        </select>
      )}
      {onBoardFilterChange && (
        <select
          value={boardFilter ?? "all"}
          onChange={(e) => onBoardFilterChange(e.target.value)}
          className={selectClass}
        >
          <option value="all">All Boards</option>
          {boardIds.map((b) => (
            <option key={b} value={b}>
              {boardNameMap[b] || b}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
