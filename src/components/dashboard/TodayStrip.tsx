/**
 * TodayStrip — Compact horizontal momentum strip.
 * Shows conditional activity signals: new video, new tools, AI signals reviewed.
 * Sits between Featured Courses and Top Topics.
 */

import { useEffect, useState } from "react";

interface TodayStats {
  newVideo: boolean;
  newToolsCount: number;
  signalsReviewed: number;
}

function useTodayStats(): TodayStats {
  const [stats, setStats] = useState<TodayStats>({
    newVideo: false,
    newToolsCount: 0,
    signalsReviewed: 0,
  });

  useEffect(() => {
    // Check for briefing items (signals reviewed)
    try {
      const res = fetch("/api/briefing");
      res.then((r) => r.json()).then((data: any) => {
        const count = Array.isArray(data?.items) ? data.items.length : 0;
        setStats((prev) => ({ ...prev, signalsReviewed: count }));
      }).catch(() => {});
    } catch {
      // Ignore — signals stay 0
    }

    // Static defaults for video + tools (can be wired to real data later)
    setStats((prev) => ({
      ...prev,
      newVideo: true,
      newToolsCount: 3,
    }));
  }, []);

  return stats;
}

export const TodayStrip = () => {
  const { newVideo, newToolsCount, signalsReviewed } = useTodayStats();

  const items: string[] = [];
  if (newVideo) items.push("🎥  New video published today");
  if (newToolsCount > 0) items.push(`🧠  ${newToolsCount} new tools added`);
  if (signalsReviewed > 0) items.push(`📊  ${signalsReviewed} AI signals reviewed`);

  if (items.length === 0) return null;

  return (
    <div className="mt-6 border-t border-b border-[var(--cc-divider)] flex items-center py-2 gap-5 overflow-x-auto">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--cc-text-muted)] flex-shrink-0">
        Today in Proven AI
      </span>
      {items.map((item, i) => (
        <span
          key={i}
          className="text-[12px] font-medium text-[var(--cc-text)] whitespace-nowrap flex-shrink-0"
        >
          {i > 0 ? "" : ""}{item}
        </span>
      ))}
    </div>
  );
};
