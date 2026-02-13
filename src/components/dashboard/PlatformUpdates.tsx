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
    <section className="mt-4">
      <div className="h-px bg-[#E5E7EB] mb-3" />
      <h2 className="text-[16px] font-bold uppercase tracking-[0.02em] text-[#111827] mb-4">
        Platform Updates
      </h2>
      <div className="h-px bg-[#9CA3AF]/15 mb-5" />

      {/* Scrollable ticker area — shows 3 rows before scrolling */}
      <div className="max-h-[96px] overflow-y-auto intel-scroll">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className="group flex items-center gap-2.5 h-8 border-t border-[#F3F4F6] first:border-t-0 hover:bg-[#F9FAFB] transition-colors duration-75 px-0.5"
          >
            <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider w-[80px] flex-shrink-0 font-mono">
              {item.label}
            </span>
            <span className="text-[13px] font-medium text-[#1F2937] truncate flex-1 group-hover:underline underline-offset-2">
              {item.title}
            </span>
            <ChevronRight className="h-3 w-3 text-[#D1D5DB] group-hover:text-[#6B7280] transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
};
