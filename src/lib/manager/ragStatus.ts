import type { Card } from "./types";

export type RagStatus = "red" | "amber" | "green" | "none";

/**
 * Compute RAG status for a card based on its due_date and warning_hours.
 * - red: overdue (due_date has passed)
 * - amber: within warning window
 * - green: beyond warning window
 * - none: no due date
 */
export function getRagStatus(card: Pick<Card, "due_date" | "warning_hours">): RagStatus {
  if (!card.due_date) return "none";

  const now = new Date();
  const due = new Date(card.due_date + "T23:59:59");
  const warningMs = (card.warning_hours ?? 48) * 3600_000;

  if (now > due) return "red";
  if (due.getTime() - now.getTime() <= warningMs) return "amber";
  return "green";
}

export const ragDotColor: Record<RagStatus, string> = {
  red: "bg-[#f85149]",
  amber: "bg-[#ff9800]",
  green: "bg-[#3fb950]",
  none: "bg-[#30363d]",
};

export const ragTextColor: Record<RagStatus, string> = {
  red: "text-[#f85149]",
  amber: "text-[#ff9800]",
  green: "text-[#3fb950]",
  none: "text-[#8b949e]",
};
