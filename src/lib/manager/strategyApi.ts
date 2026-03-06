import type { Card } from "./types";

const BASE = "/api/manage";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export interface StrategyPull {
  id: string;
  content: string;
  summary: string;
  created_at: string;
}

export interface SuggestedCard {
  title: string;
  board_id: string;
  column_id: string;
  priority: "critical" | "this_week" | "backlog";
}

// CRUD
export const fetchStrategyPulls = () =>
  apiFetch<{ pulls: StrategyPull[] }>("/strategy");

export const createStrategyPull = (content: string, summary: string) =>
  apiFetch<{ pull: StrategyPull }>("/strategy", {
    method: "POST",
    body: JSON.stringify({ content, summary }),
  });

export const updatePullSummary = (pullId: string, summary: string) =>
  apiFetch<{ ok: boolean }>(`/strategy/${pullId}`, {
    method: "PATCH",
    body: JSON.stringify({ summary }),
  });

// AI calls — run directly from the browser using the Anthropic key in localStorage
const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

function getApiKey(): string {
  const key = localStorage.getItem("provenai_anthropic_key") || "";
  if (!key) throw new Error("Anthropic API key not configured. Go to Manager Settings to add it.");
  return key;
}

function buildBoardSnapshot(cards: Card[]): string {
  const boardNames: Record<string, string> = {
    content: "Content Pipeline",
    platform: "ProvenAI Platform",
    funnel: "Funnel & Email",
    bizdev: "Business Dev",
    strategy: "Strategy & Horizon",
  };
  const doneColumns = [
    "content-published", "platform-live", "funnel-active",
    "funnel-archived", "bizdev-active", "strategy-decided", "strategy-archived",
  ];
  const active = cards.filter((c) => !doneColumns.includes(c.column_id));
  const lines = active.map(
    (c) =>
      `- [${boardNames[c.board_id] || c.board_id}] ${c.title} | priority: ${c.priority} | due: ${c.due_date || "none"} | column: ${c.column_id}`
  );
  return `CURRENT BOARD STATE (${active.length} active cards):\n${lines.join("\n")}`;
}

async function callClaude(system: string, userContent: string): Promise<string> {
  const apiKey = getApiKey();
  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

export async function generateOutstandingSummary(
  strategyContent: string,
  cards: Card[]
): Promise<string> {
  const boardSnapshot = buildBoardSnapshot(cards);
  const system = `You are a strategic business analyst. You will receive a strategy document and the current state of a project management board. Your job is to identify what's in the strategy document that is NOT yet captured as a task card on the boards. Be specific and actionable. Use plain English. Format as a concise bulleted list.`;
  const prompt = `STRATEGY DOCUMENT:\n${strategyContent}\n\n---\n\n${boardSnapshot}\n\n---\n\nList everything in the strategy document that is not yet represented by an existing card on the boards. Be specific about what's missing.`;
  return callClaude(system, prompt);
}

export async function generateSuggestedCards(
  strategyContent: string,
  cards: Card[],
  boards: { id: string; name: string }[],
  columns: { id: string; board_id: string; name: string }[]
): Promise<SuggestedCard[]> {
  const boardSnapshot = buildBoardSnapshot(cards);
  const boardList = boards.map((b) => `${b.id}: ${b.name}`).join("\n");
  const columnList = columns.map((c) => `${c.id} (board: ${c.board_id}): ${c.name}`).join("\n");

  const system = `You are a strategic business analyst that creates actionable task cards. You MUST respond with ONLY a valid JSON array of card objects. No markdown, no explanation, no code fences — just the raw JSON array.

Each card object must have exactly these fields:
- "title": string (concise action-oriented task title)
- "board_id": string (must match one of the available board IDs)
- "column_id": string (must match a column ID belonging to that board)
- "priority": "critical" | "this_week" | "backlog"

Available boards:
${boardList}

Available columns:
${columnList}`;

  const prompt = `STRATEGY DOCUMENT:\n${strategyContent}\n\n---\n\n${boardSnapshot}\n\n---\n\nCreate task cards for everything in the strategy document that isn't already captured on the boards. Only suggest genuinely new tasks. Return a JSON array.`;

  const raw = await callClaude(system, prompt);

  // Parse — strip any accidental markdown fences
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("Expected array");
    return parsed as SuggestedCard[];
  } catch {
    throw new Error("Failed to parse AI response as JSON. Raw response:\n" + raw.slice(0, 500));
  }
}
