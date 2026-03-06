import type { Board, Card, Column, ChecklistItem, CardAttachment, CardLink, CardRelation } from "./types";

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

// Boards
export const fetchBoards = () => apiFetch<{ boards: Board[] }>("/boards");

// Columns + Cards for a board
export const fetchBoard = (boardId: string) =>
  apiFetch<{ columns: Column[]; cards: Card[] }>(`/boards/${boardId}`);

// All cards (for dashboard / AI context)
export const fetchAllCards = () => apiFetch<{ cards: Card[] }>("/cards");

// Card CRUD
export const createCard = (card: Partial<Card>) =>
  apiFetch<{ card: Card }>("/cards", { method: "POST", body: JSON.stringify(card) });

export const updateCard = (id: string, updates: Partial<Card>) =>
  apiFetch<{ card: Card }>(`/cards/${id}`, { method: "PATCH", body: JSON.stringify(updates) });

export const deleteCard = (id: string) =>
  apiFetch<{ ok: boolean }>(`/cards/${id}`, { method: "DELETE" });

// Checklists
export const fetchChecklists = (cardId: string) =>
  apiFetch<{ items: ChecklistItem[] }>(`/cards/${cardId}/checklist`);

export const addChecklistItem = (cardId: string, text: string) =>
  apiFetch<{ item: ChecklistItem }>(`/cards/${cardId}/checklist`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });

export const toggleChecklistItem = (cardId: string, itemId: string, done: boolean) =>
  apiFetch<{ ok: boolean }>(`/cards/${cardId}/checklist/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ done }),
  });
