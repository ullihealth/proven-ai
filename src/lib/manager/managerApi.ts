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

// Attachments — now uses multipart/form-data upload to R2
export const fetchAttachments = (cardId: string) =>
  apiFetch<{ items: CardAttachment[] }>(`/cards/${cardId}/attachments`);

export const addAttachment = async (cardId: string, file: File): Promise<{ item: CardAttachment }> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE}/cards/${cardId}/attachments`, {
    method: "POST",
    credentials: "include",
    body: formData,
    // Do NOT set Content-Type — browser sets multipart boundary automatically
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
};

export const deleteAttachment = (cardId: string, attachmentId: string) =>
  apiFetch<{ ok: boolean }>(`/cards/${cardId}/attachments/${attachmentId}`, { method: "DELETE" });

// Links
export const fetchLinks = (cardId: string) =>
  apiFetch<{ items: CardLink[] }>(`/cards/${cardId}/links`);

export const addLink = (cardId: string, label: string, url: string) =>
  apiFetch<{ item: CardLink }>(`/cards/${cardId}/links`, {
    method: "POST",
    body: JSON.stringify({ label, url }),
  });

export const deleteLink = (cardId: string, linkId: string) =>
  apiFetch<{ ok: boolean }>(`/cards/${cardId}/links/${linkId}`, { method: "DELETE" });

// Relations
export const fetchRelations = (cardId: string) =>
  apiFetch<{ items: CardRelation[] }>(`/cards/${cardId}/relations`);

export const addRelation = (cardId: string, related_card_id: string) =>
  apiFetch<{ item: CardRelation }>(`/cards/${cardId}/relations`, {
    method: "POST",
    body: JSON.stringify({ related_card_id }),
  });

export const deleteRelation = (cardId: string, relationId: string) =>
  apiFetch<{ ok: boolean }>(`/cards/${cardId}/relations/${relationId}`, { method: "DELETE" });

// Search cards (for relation picker)
export const searchCards = (query: string) =>
  apiFetch<{ cards: (Card & { board_name?: string })[] }>(`/cards?q=${encodeURIComponent(query)}`);
