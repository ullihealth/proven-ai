import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getPlatformUpdates } from "@/lib/platformUpdates/platformUpdatesStore";

/**
 * Platform Updates — scrollable ticker list of admin-configured updates.
 * Data sourced from localStorage via platformUpdatesStore.
 * Shows all items with a max-height container so users can scroll.
 */
export const PlatformUpdates = () => {
  const items = getPlatformUpdates();

  if (items.length === 0) return null;

  return (
    <section className="mt-7">
      <h2 className="text-[16px] font-bold uppercase tracking-[0.04em] text-[var(--cc-text)] mb-3">
        Platform Updates
      </h2>
      <div className="h-px w-full bg-[var(--cc-divider)] mb-4" />

      {/* Scrollable ticker area — shows 3 rows before scrolling */}
      <div className="max-h-[96px] overflow-y-auto intel-scroll">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className="group flex items-center gap-2.5 h-8 border-t border-[var(--cc-card)] first:border-t-0 hover:bg-[var(--cc-hover)] transition-colors duration-75 px-0.5"
          >
            <span className="text-[10px] font-semibold text-[var(--cc-text-subtle)] uppercase tracking-wider w-[80px] flex-shrink-0 font-mono">
              {item.label}
            </span>
            <span className="text-[13px] font-medium text-[var(--cc-text)] truncate flex-1 group-hover:underline underline-offset-2">
              {item.title}
            </span>
            <ChevronRight className="h-3 w-3 text-[var(--cc-border)] group-hover:text-[var(--cc-text-muted)] transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
};
